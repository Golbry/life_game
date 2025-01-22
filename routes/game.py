from flask import Blueprint, render_template, jsonify, request
from datetime import datetime

bp = Blueprint('game', __name__)

# Default grid settings
DEFAULT_GRID_SIZE = 50
DEFAULT_CELL_SIZE = 15
DEFAULT_SPEED = 1.0

@bp.route('/game/board')
def board():
    """Main game board page"""
    return render_template('game/board.html',
                         grid_size=DEFAULT_GRID_SIZE,
                         cell_size=DEFAULT_CELL_SIZE,
                         default_speed=DEFAULT_SPEED)

@bp.route('/api/grid/state')
def get_grid_state():
    """Get current grid state"""
    # In a real app, this would fetch from a database or session
    return jsonify({
        'grid': [],  # 2D array of cell states
        'generation': 0,
        'alive_cells': 0,
        'speed': DEFAULT_SPEED
    })

@bp.route('/api/grid/update', methods=['POST'])
def update_grid():
    """Update grid state"""
    data = request.get_json()
    # In a real app, this would update the database or session
    return jsonify({
        'success': True,
        'updated_at': datetime.now().isoformat()
    })

@bp.route('/api/game/control', methods=['POST'])
def control_game():
    """Control game state (start/pause/reset)"""
    action = request.get_json().get('action')
    # In a real app, this would update game state in database or session
    return jsonify({
        'success': True,
        'action': action,
        'timestamp': datetime.now().isoformat()
    })
