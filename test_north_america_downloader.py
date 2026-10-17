import unittest
import tempfile
from pathlib import Path
from unittest.mock import patch

from PIL import Image

import North_America_city_image_batch as downloader
from North_America_city_image_batch import build_search_variants, normalize_city_name, score_candidate_match


class NorthAmericaDownloaderTests(unittest.TestCase):
    def test_normalize_city_name_handles_apostrophes_and_accents(self):
        self.assertEqual(normalize_city_name("St. John's"), "st johns")
        self.assertEqual(normalize_city_name("Mérida"), "merida")
        self.assertEqual(normalize_city_name("Cayo Coco"), "cayo coco")

    def test_score_candidate_match_favors_exact_city_and_country(self):
        self.assertGreater(
            score_candidate_match("St. John's", "Antigua and Barbuda", "St John's, Antigua and Barbuda - panoramio (11)"),
            score_candidate_match("St. John's", "Antigua and Barbuda", "Belize City central market")
        )

    def test_score_candidate_match_rejects_unrelated_results(self):
        self.assertEqual(score_candidate_match('Atlanta', 'United States of America', 'city skyline'), 0)

    def test_score_candidate_match_rejects_non_city_subjects_with_city_name(self):
        for title in [
            'Inside the Plane to Governor\'s Harbour',
            'Tijuana Mexico coat of arms',
            'Toronto panda close-up',
            'Philadelphia historical coin',
            'Managua satellite map',
        ]:
            city = title.split()[0]
            self.assertEqual(score_candidate_match(city, 'North America', title), 0, title)

    def test_search_variants_have_a_bounded_request_count(self):
        self.assertLessEqual(len(build_search_variants('Atlanta', 'United States of America')), 6)

    def test_documented_visual_review_can_finalize_licensed_image(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            target = Path(temp_dir) / 'test-city.webp'
            Image.new('RGB', (800, 600), 'white').save(target, 'WEBP')
            entry = {
                'filename': target.name,
                'source_url': 'https://images.example/city.jpg',
                'source_page': 'https://source.example/photo',
                'creator': 'Photo Creator',
                'license': 'CC BY-SA 4.0',
                'license_url': 'https://creativecommons.org/licenses/by-sa/4.0/',
                'attribution': 'Photo Creator, CC BY-SA 4.0',
                'validation': {'file_integrity': 'valid WebP', 'dimensions': [800, 600]},
            }
            with patch.object(downloader, 'OUTDIR', Path(temp_dir)):
                downloader.record_visual_review(
                    entry,
                    'approved',
                    'Test Reviewer',
                    'contact_sheet_01.jpg',
                    'Image depicts the assigned city landmark.',
                )
                self.assertTrue(downloader.is_final_approval_ready(entry))
                self.assertEqual(entry['download_status'], 'final_approved')
                self.assertEqual(entry['validation']['visual_review_evidence']['reviewer'], 'Test Reviewer')

    def test_visual_approval_does_not_override_missing_attribution(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            target = Path(temp_dir) / 'test-city.webp'
            Image.new('RGB', (800, 600), 'white').save(target, 'WEBP')
            entry = {
                'filename': target.name,
                'source_url': 'https://images.example/city.jpg',
                'source_page': 'https://source.example/photo',
                'creator': 'Photo Creator',
                'license': 'by',
                'license_url': 'https://creativecommons.org/licenses/by/4.0/',
                'validation': {'file_integrity': 'valid WebP', 'dimensions': [800, 600]},
            }
            with patch.object(downloader, 'OUTDIR', Path(temp_dir)):
                downloader.record_visual_review(
                    entry,
                    'approved',
                    'Test Reviewer',
                    'contact_sheet_01.jpg',
                    'Image depicts the assigned city landmark.',
                )
                self.assertFalse(downloader.is_final_approval_ready(entry))
                self.assertEqual(entry['download_status'], 'existing_review_required')

    def test_quarantine_preserves_rejected_file_and_clears_active_mapping(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            output_dir = root / 'images'
            quarantine_dir = root / 'rejected'
            output_dir.mkdir()
            quarantine_dir.mkdir()
            target = output_dir / 'city.webp'
            Image.new('RGB', (800, 600), 'white').save(target, 'WEBP')
            entry = {'city': 'Test City', 'filename': target.name, 'validation': {}}
            with patch.object(downloader, 'ROOT', root), patch.object(downloader, 'OUTDIR', output_dir), patch.object(downloader, 'QUARANTINE_DIR', quarantine_dir):
                downloader.quarantine_visual_rejection(
                    entry,
                    'Test Reviewer',
                    'contact_sheet_01.jpg',
                    'The image depicts an unrelated animal, not the assigned city.',
                )
                quarantined = root / entry['rejected_candidate_file']
                self.assertTrue(quarantined.is_file())
                self.assertFalse(target.exists())
                self.assertIsNone(entry['filename'])
                self.assertEqual(entry['download_status'], 'visual_rejected')
                self.assertEqual(entry['review_history'][0]['decision'], 'rejected')

    def test_resume_skips_previously_reviewed_entries(self):
        entry = {
            'country': 'Bahamas',
            'city': 'Andros Town',
            'download_status': 'visual_rejected',
            'validation': {'visual_review': 'rejected'},
            'filename': None,
        }
        self.assertTrue(downloader.should_skip_reprocessing(entry))

        pending = {
            'country': 'Canada',
            'city': 'Toronto',
            'download_status': 'downloaded_pending_review',
            'filename': 'ca-toronto.webp',
            'validation': {'visual_review': 'approved'},
        }
        self.assertTrue(downloader.should_skip_reprocessing(pending))


if __name__ == "__main__":
    unittest.main()
