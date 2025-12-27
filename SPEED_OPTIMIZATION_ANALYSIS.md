# Course Generation Speed Analysis

## Current Performance: 5.5 minutes (328 seconds)

### Time Breakdown:
1. **Outline Generation**: ~10-15s
2. **Topic Images (4)**: ~2s
3. **Lesson Content (16 lessons)**:
   - Batch 1 (8 lessons): ~90-120s
   - Wait 3s
   - Batch 2 (8 lessons): ~90-120s
   - **Total: ~3-4 minutes**
4. **Lesson Images**: ~20-30s
5. **Database Saves**: ~5-10s

### **Main Bottleneck: Lesson Content Generation (70% of time)**

## Proposed Optimizations (Target: < 60 seconds)

### 🚀 Aggressive Optimizations:

#### 1. **REMOVE ALL ARTIFICIAL DELAYS** (Save ~60s)
- Current: 3s between batches + retry delays
- **New**: No delays unless rate-limited
- **Impact**: -60 seconds

#### 2. **PARALLEL PROCESSING - ALL LESSONS AT ONCE** (Save ~120s)
- Current: 2 batches of 8 (sequential)
- **New**: Process all 16 lessons in parallel
- **Impact**: -120 seconds (50% faster)

#### 3. **PARALLEL IMAGE FETCHING** (Save ~15s)
- Current: Sequential (0.5s between each)
- **New**: Fetch all images concurrently
- **Impact**: -15 seconds

#### 4. **USE HAIKU MODEL FOR SPEED** (Save ~90s)
- Current: Gemini Flash (slower, high quality)
- **New**: Claude Haiku (5-10x faster)
- **Impact**: -90 seconds

#### 5. **SKIP IMAGES DURING GENERATION** (Optional)
- Generate course first
- Add images asynchronously later
- **Impact**: -20 seconds immediate

### 🎯 **Estimated New Time: 45-90 seconds** (vs current 328s)

## Implementation Priority:

### Phase 1 (Immediate - 10 min):
1. Remove artificial delays
2. Increase parallel processing to 16 lessons
3. Parallel image fetching

**Expected: ~2 minutes**

### Phase 2 (Optional - 30 min):
1. Switch to Haiku model
2. Async image generation
3. Optimize database writes

**Expected: <60 seconds**
