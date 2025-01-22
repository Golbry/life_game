from flask import Blueprint, render_template, jsonify, request
from models import GameTemplate
from extensions import db
from datetime import datetime

bp = Blueprint('template', __name__)

@bp.route('/template/library')
def library():
    """Template library interface for managing game patterns"""
    preset_templates = GameTemplate.query.filter_by(category='preset').all()
    user_templates = GameTemplate.query.filter_by(category='user').all()
    return render_template('template/library.html',
                         preset_templates=preset_templates,
                         user_templates=user_templates)

@bp.route('/api/templates', methods=['GET'])
def get_templates():
    """Get all templates"""
    templates = GameTemplate.query.all()
    return jsonify([{
        'id': t.id,
        'name': t.name,
        'pattern': t.pattern,
        'description': t.description,
        'category': t.category,
        'created_at': t.created_at.isoformat()
    } for t in templates])

@bp.route('/api/templates', methods=['POST'])
def save_template():
    """Save new template"""
    try:
        data = request.get_json()

        # Validate required fields
        if not data.get('name') or not data.get('pattern'):
            return jsonify({
                'success': False,
                'error': 'Name and pattern are required'
            }), 400

        # Create new template
        template = GameTemplate(
            name=data['name'],
            pattern=data['pattern'],
            description=data.get('description', ''),
            category='user',
            grid_size=50  # Default grid size
        )

        db.session.add(template)
        db.session.commit()

        return jsonify({
            'success': True,
            'template_id': template.id,
            'message': 'Template saved successfully'
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@bp.route('/api/templates/load', methods=['POST'])
def load_template():
    """Load template pattern"""
    template_id = request.json.get('template_id')
    template = GameTemplate.query.get_or_404(template_id)
    return jsonify({
        'success': True,
        'pattern': template.pattern
    })

@bp.route('/api/templates/delete', methods=['POST'])
def delete_template():
    """Delete user template"""
    template_id = request.json.get('template_id')
    template = GameTemplate.query.get_or_404(template_id)
    if template.category == 'preset':
        return jsonify({
            'success': False,
            'message': 'Cannot delete preset templates'
        }), 403
    db.session.delete(template)
    db.session.commit()
    return jsonify({'success': True})
