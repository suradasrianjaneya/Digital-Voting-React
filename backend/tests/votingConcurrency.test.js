import prisma from '../src/config/db.js';
import { castVote } from '../src/services/votingService.js';
import dotenv from 'dotenv';

dotenv.config();

async function runValidation() {
  console.log('\n==================================================');
  console.log('🧪   VOTINGplatform CONCURRENCY TEST SUITE      🧪');
  console.log('==================================================\n');

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl || dbUrl.includes('postgres:postgres') || dbUrl.includes('username:password')) {
    console.log('⚠️   DATABASE_URL placeholder detected or missing in .env.');
    console.log('👉   To run active concurrency verification:');
    console.log('     1. Configure DATABASE_URL in backend/.env with a valid Neon / local PostgreSQL URL.');
    console.log('     2. Run database migrations: npm run db:migrate');
    console.log('     3. Run this script: node tests/votingConcurrency.test.js\n');
    console.log('==================================================\n');
    return;
  }

  console.log('⌛ Connecting to database...');
  try {
    await prisma.$connect();
    console.log('✅ Connected successfully!');
  } catch (error) {
    console.error('❌ Failed to connect to PostgreSQL database:', error.message);
    return;
  }

  // Set up testing models
  let testUser = null;
  let testElection = null;
  let testCandidate = null;

  try {
    console.log('\n📦 Seeding temporary validation records...');

    // Create test user (Verified and Approved)
    testUser = await prisma.user.create({
      data: {
        fullName: 'Concurrency Test Voter',
        email: `concur_${Date.now()}@validation.com`,
        password: 'hashed_password_dummy',
        role: 'USER',
        isVerified: true,
        isApproved: true,
      },
    });

    // Create test active election allowing only 1 vote
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    testElection = await prisma.election.create({
      data: {
        name: 'Validation Concurrency Election',
        description: 'Temporary election created for concurrency testing.',
        type: 'Test Board',
        startDate: now,
        endDate: tomorrow,
        votingStartTime: '00:00',
        votingEndTime: '23:59',
        maxVotesAllowed: 1,
        allowMultiplePositions: false,
        status: 'ACTIVE',
        isPublic: true,
      },
    });

    // Create test candidate definition and candidate
    const nameDefinition = await prisma.candidateFieldDefinition.create({
      data: {
        electionId: testElection.id,
        name: 'Candidate Name',
        type: 'TEXT',
        isRequired: true,
        isVisibleOnCard: true,
        isCustom: false,
      },
    });

    testCandidate = await prisma.candidate.create({
      data: {
        electionId: testElection.id,
        fieldValues: {
          create: {
            fieldDefinitionId: nameDefinition.id,
            value: 'Candidate Test A',
          },
        },
      },
    });

    console.log(`✅ Seeded Voter: ${testUser.email}`);
    console.log(`✅ Seeded Election ID: ${testElection.id}`);
    console.log(`✅ Seeded Candidate ID: ${testCandidate.id}`);

    console.log('\n🚀 Triggering 5 concurrent voting requests simultaneously...');

    const results = await Promise.allSettled([
      castVote({ userId: testUser.id, electionId: testElection.id, candidateId: testCandidate.id, ipAddress: '127.0.0.1' }),
      castVote({ userId: testUser.id, electionId: testElection.id, candidateId: testCandidate.id, ipAddress: '127.0.0.1' }),
      castVote({ userId: testUser.id, electionId: testElection.id, candidateId: testCandidate.id, ipAddress: '127.0.0.1' }),
      castVote({ userId: testUser.id, electionId: testElection.id, candidateId: testCandidate.id, ipAddress: '127.0.0.1' }),
      castVote({ userId: testUser.id, electionId: testElection.id, candidateId: testCandidate.id, ipAddress: '127.0.0.1' }),
    ]);

    console.log('\n📊 Concurrency Outcomes Summary:');
    let successfulVotes = 0;
    let rejectedVotes = 0;

    results.forEach((res, idx) => {
      if (res.status === 'fulfilled') {
        successfulVotes++;
        console.log(`   Thread #${idx + 1}: ✅ VOTE RECORDED (ID: ${res.value.id})`);
      } else {
        rejectedVotes++;
        console.log(`   Thread #${idx + 1}: ❌ REJECTED (Reason: ${res.reason.message})`);
      }
    });

    console.log('\n🏁 Concurrency Evaluation:');
    if (successfulVotes === 1 && rejectedVotes === 4) {
      console.log('   🎉 SUCCESS! Transaction locks blocked concurrent threads. Exactly 1 vote recorded.');
    } else {
      console.log(`   🚨 FAILURE! Expected exactly 1 successful vote. Got: ${successfulVotes} successes.`);
    }

  } catch (err) {
    console.error('❌ An error occurred during validation steps:', err);
  } finally {
    // Cleanup seed records
    console.log('\n🧹 Cleaning up validation database records...');
    try {
      if (testElection) {
        await prisma.election.delete({ where: { id: testElection.id } });
      }
      if (testUser) {
        await prisma.user.delete({ where: { id: testUser.id } });
      }
      console.log('✅ Cleaned up successfully.');
    } catch (cleanErr) {
      console.error('⚠️ Cleanup failed partially:', cleanErr.message);
    }

    await prisma.$disconnect();
    console.log('\n==================================================\n');
  }
}

runValidation();
