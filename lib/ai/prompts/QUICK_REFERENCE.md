# 🎯 QUICK REFERENCE: Enhanced Prompts

## ⚡ Enable Enhanced Prompts
```bash
# Add to .env.local
USE_ENHANCED_PROMPTS=true
```

## 🔄 Disable (Rollback)
```bash
# Add to .env.local
USE_ENHANCED_PROMPTS=false
```

## 🆘 Emergency Restore
```bash
# Restore original file from backup
cp lib/ai/agent-system.ts.backup-20260204-205129 lib/ai/agent-system.ts
```

## ✅ Verify Current Mode
Check console output when generating a course:
- `[PlanningAgent] Using ENHANCED prompt system` ✅
- `[PlanningAgent] Using ORIGINAL prompt system` 🔄

## 📋 What Changed?
1. **Quality Checks**: Requires specific metrics, tool names, tradeoffs
2. **Module Structure**: Foundation → Application → Mastery
3. **Industry Context**: Must mention vendors, costs, team sizes
4. **Success Metrics**: Observable, time-bound, artifact-producing

## 🎓 Example Improvement

### Before (Original)
```
"Build an ML project roadmap"
```

### After (Enhanced)
```
"Create 3-month ML implementation plan including:
- 5 use case prioritization criteria
- Vendor evaluation rubric (15+ factors)
- Stakeholder communication templates
- Budget estimation model ($50K-$500K range)"
```

---
**Status**: Currently using **ORIGINAL** prompts (safe mode)  
**To enable**: Set `USE_ENHANCED_PROMPTS=true` in `.env.local`
