#!/usr/bin/env node

// Test script for video generation
const fetch = require('node-fetch');
const fs = require('fs');

const API_BASE = 'http://localhost:3000/api';

const testQuizzes = [
  {
    title: "Quiz Geography",
    questions: [
      { question: "Jaka jest stolica Francji?", answer: "Paryż" },
      { question: "Który ocean jest największy?", answer: "Spokojny" },
      { question: "Ile kontynentów ma Ziemia?", answer: "7" }
    ]
  },
  {
    title: "Quiz Science",
    questions: [
      { question: "Co to jest H2O?", answer: "Woda" },
      { question: "Która planeta jest najbliżej Słońca?", answer: "Merkury" },
      { question: "Ile nóg ma pająk?", answer: "8" },
      { question: "Co produkują rośliny?", answer: "Tlen" }
    ]
  }
];

async function generateVideo(quiz) {
  console.log(`\n🎬 Generating video: "${quiz.title}"`);
  
  try {
    // Start video generation
    const response = await fetch(`${API_BASE}/video/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(quiz)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log(`✅ Job created: ${result.jobId}`);
      return await waitForCompletion(result.jobId);
    } else {
      console.error(`❌ Error: ${result.message}`);
      return null;
    }
  } catch (error) {
    console.error(`❌ Network error: ${error.message}`);
    return null;
  }
}

async function waitForCompletion(jobId) {
  console.log(`⏳ Waiting for completion...`);
  
  let attempts = 0;
  const maxAttempts = 30; // 30 seconds max
  
  while (attempts < maxAttempts) {
    try {
      const response = await fetch(`${API_BASE}/video/status/${jobId}`);
      const status = await response.json();
      
      console.log(`📊 Status: ${status.status} (${status.progress}%) - ${status.message}`);
      
      if (status.status === 'completed') {
        console.log(`✅ Video ready: ${status.videoUrl}`);
        return status;
      } else if (status.status === 'failed') {
        console.error(`❌ Generation failed: ${status.error}`);
        return null;
      }
      
      // Wait 1 second before next check
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
      
    } catch (error) {
      console.error(`❌ Status check error: ${error.message}`);
      break;
    }
  }
  
  console.error(`❌ Timeout waiting for completion`);
  return null;
}

async function testServer() {
  console.log('🔍 Testing server connection...');
  
  try {
    const response = await fetch(`${API_BASE}/../health`);
    if (response.ok) {
      console.log('✅ Server is running');
      return true;
    } else {
      console.error('❌ Server health check failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Cannot connect to server. Make sure backend is running on port 3000');
    return false;
  }
}

async function main() {
  console.log('🚀 TikTok Video Generator - Test Script');
  console.log('=====================================');
  
  // Test server connection
  const serverOk = await testServer();
  if (!serverOk) {
    process.exit(1);
  }
  
  // Test video generation
  for (let i = 0; i < testQuizzes.length; i++) {
    const quiz = testQuizzes[i];
    const result = await generateVideo(quiz);
    
    if (result) {
      console.log(`🎉 Success! Video generated for "${quiz.title}"`);
      console.log(`📹 Duration: ${result.duration || 'N/A'}`);
      console.log(`🔗 URL: ${result.videoUrl}`);
    } else {
      console.log(`💥 Failed to generate video for "${quiz.title}"`);
    }
    
    // Wait between tests
    if (i < testQuizzes.length - 1) {
      console.log('\n⏸️  Waiting 3 seconds before next test...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  console.log('\n🏁 Testing completed!');
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error.message);
  process.exit(1);
});

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { generateVideo, testServer }; 