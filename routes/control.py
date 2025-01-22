from flask import Blueprint, render_template, jsonify, request
from datetime import datetime

bp = Blueprint('control', __name__)

@bp.route('/game/control')
def panel():
    """Game control panel interface"""
    default_settings = {
        'min_speed': 0.5,
        'max_speed': 3.0,
        'default_speed': 1.0,
        'min_grid_size': 20,
        'max_grid_size': 100,
        'default_grid_size': 50
    }
    return render_template('game/control.html', settings=default_settings)

@bp.route('/api/control/speed', methods=['POST'])
def update_speed():
    """Update game evolution speed"""
    speed = request.json.get('speed', 1.0)

    # Validate speed range
    if not (0.5 <= speed <= 10.0):
        return jsonify({
            'success': False,
            'error': 'Speed must be between 0.5 and 10.0',
            'timestamp': datetime.now().isoformat()
        }), 400

    return jsonify({
        'success': True,
        'speed': speed,
        'timestamp': datetime.now().isoformat()
    })

@bp.route('/api/control/state', methods=['POST'])
def update_state():
    """Update game state (start/pause/reset)"""
    action = request.json.get('action')
    return jsonify({
        'success': True,
        'action': action,
        'timestamp': datetime.now().isoformat()
    })

@bp.route('/api/control/grid', methods=['POST'])
def update_grid():
    """Update grid size"""
    size = request.json.get('size', 50)

    # Validate grid size range
    if not (20 <= size <= 100):
        return jsonify({
            'success': False,
            'error': 'Grid size must be between 20 and 100',
            'timestamp': datetime.now().isoformat()
        }), 400

    return jsonify({
        'success': True,
        'size': size,
        'timestamp': datetime.now().isoformat()
    })
