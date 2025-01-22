from flask_login import UserMixin
from extensions import db
from datetime import datetime

class User(UserMixin, db.Model):
    """用户模型"""
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(512), nullable=False)

class GameTemplate(db.Model):
    """游戏模板模型"""
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)  # 模板名称
    pattern = db.Column(db.Text, nullable=False)      # 模板图案数据
    description = db.Column(db.Text)                  # 模板描述
    category = db.Column(db.String(50))              # 模板分类 (preset/user/local)
    grid_size = db.Column(db.Integer, default=50)    # 网格尺寸
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    is_local = db.Column(db.Boolean, default=False)  # 是否为本地模板

    # Add relationship
    user = db.relationship('User', backref=db.backref('templates', lazy=True))

class Game(db.Model):
    """游戏会话模型"""
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    grid_size = db.Column(db.Integer, default=50)    # 网格尺寸
    speed = db.Column(db.Float, default=1.0)         # 演化速度
    is_running = db.Column(db.Boolean, default=False) # 运行状态
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Add relationship
    user = db.relationship('User', backref=db.backref('games', lazy=True))
    statistics = db.relationship('GameStatistics', backref='game', lazy=True)

class GameStatistics(db.Model):
    """游戏统计模型"""
    id = db.Column(db.Integer, primary_key=True)
    game_id = db.Column(db.Integer, db.ForeignKey('game.id'))  # 关联游戏会话
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    generation = db.Column(db.Integer, default=0)     # 演化代数
    alive_cells = db.Column(db.Integer, default=0)    # 存活细胞数
    total_time = db.Column(db.Integer, default=0)     # 游戏时长(秒)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Add relationship
    user = db.relationship('User', backref=db.backref('statistics', lazy=True))
