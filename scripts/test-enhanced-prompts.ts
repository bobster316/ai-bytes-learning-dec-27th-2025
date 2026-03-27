/**
 * Test Script: Generate Course with Enhanced Prompts
 * 
 * This script generates a 1-module, 1-lesson course to demonstrate
 * the Tier 1 prompt improvements.
 */

import { createClient } from '@supabase/supabase-js';
import { AgentOrchestrator } from '../lib/ai/agent-system';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function testEnhancedPrompts() {
    console.log('\n🎯 TESTING ENHANCED PROMPTS (Tier 1)\n');
    console.log('='.repeat(60));

    const orchestrator = new AgentOrchestrator();

    const input = {
        courseName: 'Customer Churn Prediction with Machine Learning',
        difficultyLevel: 'intermediate',
        topicCount: 1,  // 1 module
        lessonsPerTopic: 1,  // 1 lesson
        userContext: {
            targetAudience: 'Product managers and data analysts in SaaS companies',
            industryFocus: 'B2B SaaS'
        }
    };

    console.log('\n📋 Input Parameters:');
    console.log(`   Course: ${input.courseName}`);
    console.log(`   Difficulty: ${input.difficultyLevel}`);
    console.log(`   Structure: ${input.topicCount} module, ${input.lessonsPerTopic} lesson`);
    console.log(`   Target: ${input.userContext.targetAudience}`);
    console.log('\n' + '='.repeat(60));

    console.log('\n⏳ Generating course with ENHANCED prompts...\n');

    try {
        const course = await orchestrator.generateCourse(input, async (progress, message) => {
            console.log(`   [${progress}%] ${message}`);
        });

        console.log('\n' + '='.repeat(60));
        console.log('✅ COURSE GENERATED SUCCESSFULLY');
        console.log('='.repeat(60));

        console.log('\n📊 TIER 1 IMPROVEMENTS ANALYSIS:\n');

        // 1. Check for specific metrics/percentages
        const courseText = JSON.stringify(course);
        const hasPercentages = /\d+%|\d+\s*percent/gi.test(courseText);
        const hasTimelines = /\d+\s*(weeks?|months?|days?)/gi.test(courseText);
        const hasCosts = /\$\d+[KkMm]?/g.test(courseText);

        console.log('1️⃣  QUALITY VERIFICATION LAYER:');
        console.log(`   ✓ Specific percentages: ${hasPercentages ? '✅ FOUND' : '❌ MISSING'}`);
        console.log(`   ✓ Timelines/durations: ${hasTimelines ? '✅ FOUND' : '❌ MISSING'}`);
        console.log(`   ✓ Cost metrics: ${hasCosts ? '✅ FOUND' : '❌ MISSING'}`);

        // 2. Check for vendor tools
        const vendorTools = ['Klaviyo', 'Shopify', 'Amplitude', 'Mixpanel', 'Segment', 'Snowflake', 'BigQuery', 'Salesforce'];
        const foundTools = vendorTools.filter(tool => courseText.includes(tool));

        console.log(`\n2️⃣  INDUSTRY CONTEXT GROUNDING:`);
        console.log(`   ✓ Vendor tools mentioned: ${foundTools.length > 0 ? '✅ ' + foundTools.join(', ') : '❌ NONE'}`);

        // 3. Check module sequencing
        console.log(`\n3️⃣  PEDAGOGICAL ARCHITECTURE:`);
        console.log(`   ✓ Module type: ${course.topics[0]?.topicType || 'N/A'}`);
        console.log(`   ✓ Expected: "foundation" (Module 1 should be WHAT + WHY)`);

        // 4. Check for observable outcomes
        const outcomes = course.courseMetadata?.practicalOutcomes || [];
        const hasArtifacts = outcomes.some((o: string) =>
            /create|build|develop|design|implement/i.test(o) &&
            /template|rubric|plan|model|framework/i.test(o)
        );

        console.log(`\n4️⃣  SUCCESS METRIC DEFINITIONS:`);
        console.log(`   ✓ Artifact-producing outcomes: ${hasArtifacts ? '✅ FOUND' : '❌ MISSING'}`);
        console.log(`   ✓ Example outcomes:`);
        outcomes.slice(0, 2).forEach((outcome: string, i: number) => {
            console.log(`      ${i + 1}. ${outcome}`);
        });

        // 5. Check for banned phrases
        const bannedPhrases = ['demystify', 'unlock', 'dive deep', 'journey', 'landscape', 'harness'];
        const foundBanned = bannedPhrases.filter(phrase =>
            new RegExp(phrase, 'i').test(courseText)
        );

        console.log(`\n5️⃣  ANTI-AI PHRASE ENFORCEMENT:`);
        console.log(`   ✓ Banned phrases found: ${foundBanned.length === 0 ? '✅ NONE (Good!)' : '❌ ' + foundBanned.join(', ')}`);

        console.log('\n' + '='.repeat(60));
        console.log('\n📄 COURSE STRUCTURE:\n');
        console.log(`Title: ${course.refinedCourseTitle}`);
        console.log(`\nDescription: ${course.courseMetadata?.learningObjectives?.[0] || 'N/A'}`);
        console.log(`\nModule 1: ${course.topics[0]?.topicName}`);
        console.log(`  Type: ${course.topics[0]?.topicType}`);
        console.log(`  Description: ${course.topics[0]?.description?.substring(0, 150)}...`);
        console.log(`\n  Lesson 1: ${course.topics[0]?.lessons[0]?.lessonTitle}`);
        console.log(`    Objectives: ${course.topics[0]?.lessons[0]?.learningObjectives?.join(', ')}`);

        console.log('\n' + '='.repeat(60));
        console.log('✅ TEST COMPLETE');
        console.log('='.repeat(60));

        return course;

    } catch (error) {
        console.error('\n❌ ERROR:', error);
        throw error;
    }
}

// Run the test
testEnhancedPrompts()
    .then(() => {
        console.log('\n✅ Enhanced prompt test completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Test failed:', error);
        process.exit(1);
    });
