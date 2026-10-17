require('dotenv').config();
const {PrismaClient}=require('@prisma/client');
(async()=>{
  const p=new PrismaClient();
  const u=await p.user.findUnique({where:{email:'audit+14880@example.com'}});
  if(!u){console.log('user not found'); await p.$disconnect(); return;}
  const sessions=await p.session.findMany({where:{userId:u.id},orderBy:{createdAt:'desc'}});
  console.log('latest session count',sessions.length);
  if(sessions[0]){
    console.log('latest.refreshTokenHash exists:', !!sessions[0].refreshTokenHash);
    if(sessions[0].refreshTokenHash) console.log('latest.refreshTokenHash startsWith $argon2:', sessions[0].refreshTokenHash.startsWith('$argon2'));
  }
  await p.$disconnect();
})();
