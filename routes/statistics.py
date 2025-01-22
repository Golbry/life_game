from flask import Blueprint, render_template, jsonify
from models import GameStatistics
from sqlalchemy import func
from datetime import datetime, timedelta

bp = Blueprint('statistics', __name__)

@bp.route('/statistics')
def dashboard():
    """Statistics and analysis dashboard"""
    # Get basic statistics
    total_games = GameStatistics.query.count()
    max_generation = GameStatistics.query.with_entities(func.max(GameStatistics.generation)).scalar() or 0
    avg_alive_cells = GameStatistics.query.with_entities(func.avg(GameStatistics.alive_cells)).scalar() or 0

    return render_template('statistics/dashboard.html',
                         total_games=total_games,
                         max_generation=max_generation,
                         avg_alive_cells=round(avg_alive_cells, 2))

@bp.route('/api/statistics/overview')
def get_overview():
    """Get overview statistics"""
    stats = GameStatistics.query.order_by(GameStatistics.created_at.desc()).first()

    if not stats:
        return jsonify({
            'current_generation': 0,
            'alive_cells': 0,
            'total_time': 0
        })

    return jsonify({
        'current_generation': stats.generation,
        'alive_cells': stats.alive_cells,
        'total_time': stats.total_time
    })

@bp.route('/api/statistics/history')
def get_history():
    """Get historical statistics"""
    # Get last 24 hours of data
    start_time = datetime.now() - timedelta(hours=24)
    history = GameStatistics.query\
        .filter(GameStatistics.created_at >= start_time)\
        .order_by(GameStatistics.created_at.asc())\
        .all()

    return jsonify([{
        'generation': h.generation,
        'alive_cells': h.alive_cells,
        'total_time': h.total_time,
        'timestamp': h.created_at.isoformat()
    } for h in history])
