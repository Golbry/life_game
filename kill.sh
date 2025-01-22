echo "正在清理 8887 端口进程..."
PID=$(lsof -ti :8887)
[ -n "$PID" ] && kill -9 $PID