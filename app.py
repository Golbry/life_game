from flask import Flask, redirect, url_for
from flask_cors import CORS
from extensions import db, migrate, login_manager
from commands import init_app
from datetime import datetime

app = Flask(__name__)

# DB配置
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SECRET_KEY'] = 'your_secret_key'
app.config.from_prefixed_env()

# 初始化扩展
CORS(app)
db.init_app(app)
migrate.init_app(app, db)
login_manager.init_app(app)

# 注册命令
init_app(app)

# 注册蓝图
from routes.game import bp as game_bp
from routes.template import bp as template_bp
from routes.tutorial import bp as tutorial_bp
from routes.statistics import bp as statistics_bp

# Register blueprints
app.register_blueprint(game_bp)
app.register_blueprint(template_bp)
app.register_blueprint(tutorial_bp)
app.register_blueprint(statistics_bp)

# 添加默认路由重定向
@app.route('/')
def index():
    return redirect(url_for('game.board'))

# 注入全局变量到模板
@app.context_processor
def inject_globals():
    return {
        'abs': abs,
        'min': min,
        'current_datetime': datetime.now()
    }

if __name__ == '__main__':
    app.run(debug=True)
