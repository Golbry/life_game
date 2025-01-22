from flask import Blueprint, render_template, jsonify, request
from datetime import datetime

bp = Blueprint('tutorial', __name__)

# Tutorial steps data with enhanced content
TUTORIAL_STEPS = [
    {
        'id': 1,
        'title': 'Welcome to Game of Life',
        'content': '''
            Welcome to Conway's Game of Life! This interactive tutorial will guide you through
            the basic concepts and rules of this fascinating cellular automaton simulation.
            Follow along to learn how to create and control evolving patterns of life.
        '''.strip(),
        'image_url': 'https://image.coze.run/?prompt=A welcoming and friendly game tutorial interface with clean modern design, showing cellular automaton patterns&image_size=landscape_16_9'
    },
    {
        'id': 2,
        'title': 'Basic Rules',
        'content': '''
            The Game of Life follows simple rules that create complex patterns:
            • Each cell is either alive (black) or dead (white)
            • Cells interact with their eight neighbors
            • Patterns evolve based on these interactions
            Try clicking cells in the demo grid below to see how it works!
        '''.strip(),
        'image_url': 'https://image.coze.run/?prompt=Simple visual representation of game of life rules with cells in grid, showing neighbor interactions&image_size=square_hd'
    },
    {
        'id': 3,
        'title': 'Cell Interaction',
        'content': '''
            Interacting with the game is easy:
            • Click any cell to toggle between alive and dead states
            • Create patterns by clicking multiple cells
            • Watch how your patterns evolve over time
            Practice creating patterns in the interactive grid below.
        '''.strip(),
        'image_url': 'https://image.coze.run/?prompt=Interactive grid showing mouse cursor clicking cells in game of life with visual feedback&image_size=square_hd'
    },
    {
        'id': 4,
        'title': 'Population Rules',
        'content': '''
            The core rules that govern cell life and death:
            1. Survival: A live cell survives if it has 2 or 3 live neighbors
            2. Death: A live cell dies if it has fewer than 2 or more than 3 neighbors
            3. Birth: A dead cell becomes alive if it has exactly 3 live neighbors
        '''.strip(),
        'image_url': 'https://image.coze.run/?prompt=Visual explanation of game of life neighbor rules with numbered cells showing survival death and birth conditions&image_size=landscape_4_3'
    },
    {
        'id': 5,
        'title': 'Controls',
        'content': '''
            Now that you understand the rules, let's look at the controls:
            • Start/Pause: Control the simulation
            • Reset: Clear the grid
            • Speed: Adjust how fast patterns evolve
            • Grid Size: Change the playing field size
            Ready to play? Click 'Finish' to start your journey!
        '''.strip(),
        'image_url': 'https://image.coze.run/?prompt=Clean modern game control panel with start pause and reset buttons clearly labeled&image_size=landscape_16_9'
    }
]

@bp.route('/tutorial')
def index():
    """Tutorial system interface with interactive guidance and rule explanations"""
    return render_template('tutorial/index.html',
                         steps=TUTORIAL_STEPS,
                         current_time=datetime.now())

@bp.route('/api/tutorial/progress', methods=['POST'])
def update_progress():
    """Update tutorial progress"""
    try:
        step_id = request.json.get('step_id')
        if not isinstance(step_id, int) or step_id < 1 or step_id > len(TUTORIAL_STEPS):
            return jsonify({
                'success': False,
                'error': 'Invalid step ID',
                'timestamp': datetime.now().isoformat()
            }), 400

        return jsonify({
            'success': True,
            'current_step': step_id,
            'total_steps': len(TUTORIAL_STEPS),
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@bp.route('/api/tutorial/step/<string:step_id>')
def get_step(step_id):
    """Get specific tutorial step content"""
    try:
        step_num = int(step_id)
        step = next((step for step in TUTORIAL_STEPS if step['id'] == step_num), None)

        if step:
            return jsonify({
                'success': True,
                'step': step,
                'timestamp': datetime.now().isoformat()
            })

        return jsonify({
            'success': False,
            'error': 'Step not found',
            'timestamp': datetime.now().isoformat()
        }), 404
    except ValueError:
        return jsonify({
            'success': False,
            'error': 'Invalid step ID format',
            'timestamp': datetime.now().isoformat()
        }), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500
