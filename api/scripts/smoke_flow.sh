#!/bin/bash
# YT 家具官网 · 三端全流程联调冒烟脚本（步骤 7.2）
# 前置：api(:8000) frontend(:5173) backend(:5174) 已启动
set -u
API="http://127.0.0.1:8000"
PASS=0; FAIL=0
ok()   { PASS=$((PASS+1)); echo "  ✅ $1"; }
bad()  { FAIL=$((FAIL+1)); echo "  ❌ $1 → $2"; }
chk()  { # chk <描述> <期望状态码> <curl...>
  local desc="$1" expect="$2"; shift 2
  local code body
  code=$(curl -s -o /tmp/flow_body.json -w "%{http_code}" -m 8 "$@" 2>/dev/null)
  if [ "$code" = "$expect" ]; then ok "$desc [$code]"; else bad "$desc" "期望 $expect 实得 $code"; fi
}

echo "========== 前台公开流程 =========="
chk "轮播图列表" 200 "$API/api/public/banners"
chk "产品系列列表" 200 "$API/api/public/series"
chk "产品列表" 200 "$API/api/public/products"
chk "新闻列表" 200 "$API/api/public/news"
chk "公司介绍" 200 "$API/api/public/company"
chk "职位列表" 200 "$API/api/public/jobs"
chk "留言提交" 200 -X POST -H "Content-Type: application/json" \
  -d '{"name":"联调测试","phone":"13800000000","content":"三端联调留言"}' "$API/api/public/messages"
chk "留言60s防刷(429)" 429 -X POST -H "Content-Type: application/json" \
  -d '{"name":"联调测试","phone":"13800000000","content":"重复提交"}' "$API/api/public/messages"
chk "手机号格式错(422)" 422 -X POST -H "Content-Type: application/json" \
  -d '{"name":"x","phone":"123","content":"x"}' "$API/api/public/messages"

echo "========== 后台管理流程 =========="
# 登录：本地联调 CAPTCHA_BYPASS=true（.env），验证码任意即可
LOGIN=$(curl -s -m 8 -X POST -H "Content-Type: application/json" \
  -d '{"username":"10000","password":"YT@2026","captcha":"0000","captcha_id":"bypass"}' \
  "$API/api/sys/auth/login" 2>/dev/null)
TOKEN=$(echo "$LOGIN" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
if [ -n "$TOKEN" ]; then ok "后台登录(10000/YT@2026)"; else bad "后台登录" "$LOGIN"; fi
AUTH="Authorization: Bearer $TOKEN"

chk "当前用户 me" 200 "$API/api/sys/auth/me" -H "$AUTH"
chk "用户列表" 200 "$API/api/sys/users" -H "$AUTH"
chk "角色列表" 200 "$API/api/sys/roles" -H "$AUTH"
chk "产品列表(管理)" 200 "$API/api/sys/products" -H "$AUTH"
chk "新闻列表(管理)" 200 "$API/api/sys/news" -H "$AUTH"
chk "轮播图列表(管理)" 200 "$API/api/sys/banners" -H "$AUTH"
chk "公司介绍(管理)" 200 "$API/api/sys/company" -H "$AUTH"
chk "职位列表(管理)" 200 "$API/api/sys/jobs" -H "$AUTH"
chk "留言列表(管理，应含新留言)" 200 "$API/api/sys/messages" -H "$AUTH"
chk "统计总览" 200 "$API/api/sys/stats/overview" -H "$AUTH"
chk "统计Top10" 200 "$API/api/sys/stats/top" -H "$AUTH"
chk "审计列表(含登录留痕)" 200 "$API/api/sys/audits" -H "$AUTH"
chk "无token访问(401)" 401 "$API/api/sys/products"
chk "错token访问(401)" 401 "$API/api/sys/products" -H "Authorization: Bearer bad.token.here"

# 验证留言闭环：公开提交 → 后台可见
MSG_OK=$(curl -s -m 8 "$API/api/sys/messages" -H "$AUTH" 2>/dev/null | grep -c "联调测试" || true)
if [ "$MSG_OK" -ge 1 ]; then ok "留言闭环：前台提交 → 后台可见"; else bad "留言闭环" "后台未见新留言"; fi

echo ""
echo "========== 结果：通过 $PASS / 失败 $FAIL =========="
[ "$FAIL" -eq 0 ]
