import click
from flask.cli import with_appcontext
from custom_commands import cmd_sync_db, cmd_reset_migration

@click.command('reset-migration')
@with_appcontext
def reset_migration_command():
    cmd_reset_migration()

@click.command('sync-db')
@with_appcontext
def sync_db_command():
    cmd_sync_db()

@click.command('seed-data')
@with_appcontext
def seed_data_command():
    """Initialize seed data for the application."""
    from models import GameTemplate, GameStatistics
    from extensions import db
    from datetime import datetime, timedelta

    # Clear existing data
    GameTemplate.query.delete()
    GameStatistics.query.delete()

    # Preset templates
    preset_templates = [
        {
            'name': 'Gosper Glider Gun',
            'pattern': '''[[false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
                         [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,true,false,false,false,false,false,false,false,false,false,false,false,false,false],
                         [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,true,false,true,false,false,false,false,false,false,false,false,false,false,false,false,false],
                         [false,false,false,false,false,false,false,false,false,false,false,false,true,true,false,false,false,false,false,false,true,true,false,false,false,false,false,false,false,false,false,false,false,false,true,true,false,false],
                         [false,false,false,false,false,false,false,false,false,false,false,true,false,false,false,true,false,false,false,false,true,true,false,false,false,false,false,false,false,false,false,false,false,false,true,true,false,false],
                         [true,true,false,false,false,false,false,false,false,false,true,false,false,false,false,false,true,false,false,false,true,true,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
                         [true,true,false,false,false,false,false,false,false,false,true,false,false,false,true,false,true,true,false,false,false,false,true,false,true,false,false,false,false,false,false,false,false,false,false,false,false,false],
                         [false,false,false,false,false,false,false,false,false,false,true,false,false,false,false,false,true,false,false,false,false,false,false,false,true,false,false,false,false,false,false,false,false,false,false,false,false,false],
                         [false,false,false,false,false,false,false,false,false,false,false,true,false,false,false,true,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
                         [false,false,false,false,false,false,false,false,false,false,false,false,true,true,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false]]''',
            'description': 'The first known gun pattern, creates gliders periodically',
            'category': 'preset'
        },
        {
            'name': 'Block',
            'pattern': '[[true,true],[true,true]]',
            'description': 'A stable 2x2 block pattern',
            'category': 'preset'
        },
        {
            'name': 'Beehive',
            'pattern': '[[false,true,true,false],[true,false,false,true],[false,true,true,false]]',
            'description': 'A stable honeycomb-like pattern',
            'category': 'preset'
        },
        {
            'name': 'Loaf',
            'pattern': '[[false,true,true,false],[true,false,false,true],[false,true,false,true],[false,false,true,false]]',
            'description': 'A stable bread-like pattern',
            'category': 'preset'
        },
        {
            'name': 'Boat',
            'pattern': '[[true,true,false],[true,false,true],[false,true,false]]',
            'description': 'A stable boat-shaped pattern',
            'category': 'preset'
        },
        {
            'name': 'Tub',
            'pattern': '[[false,true,false],[true,false,true],[false,true,false]]',
            'description': 'A stable tub-shaped pattern',
            'category': 'preset'
        },
        {
            'name': 'Blinker',
            'pattern': '[[false,true,false],[false,true,false],[false,true,false]]',
            'description': 'A period 2 oscillator',
            'category': 'preset'
        },
        {
            'name': 'Toad',
            'pattern': '[[false,true,true,true],[true,true,true,false]]',
            'description': 'A period 2 oscillator',
            'category': 'preset'
        },
        {
            'name': 'Beacon',
            'pattern': '[[true,true,false,false],[true,true,false,false],[false,false,true,true],[false,false,true,true]]',
            'description': 'A period 2 oscillator',
            'category': 'preset'
        },
        {
            'name': 'Pulsar',
            'pattern': '''[[false,false,false,false,false,false,false,false,false,false,false,false,false],
                         [false,false,false,true,true,true,false,false,true,true,true,false,false],
                         [false,false,false,false,false,false,false,false,false,false,false,false,false],
                         [false,true,false,false,false,false,true,false,false,false,false,true,false],
                         [false,true,false,false,false,false,true,false,false,false,false,true,false],
                         [false,true,false,false,false,false,true,false,false,false,false,true,false],
                         [false,false,false,true,true,true,false,false,true,true,true,false,false],
                         [false,false,false,false,false,false,false,false,false,false,false,false,false],
                         [false,false,false,true,true,true,false,false,true,true,true,false,false],
                         [false,true,false,false,false,false,true,false,false,false,false,true,false],
                         [false,true,false,false,false,false,true,false,false,false,false,true,false],
                         [false,true,false,false,false,false,true,false,false,false,false,true,false],
                         [false,false,false,false,false,false,false,false,false,false,false,false,false]]''',
            'description': 'A period 3 oscillator',
            'category': 'preset'
        },
        {
            'name': 'Pentadecathlon',
            'pattern': '''[[false,false,true,false,false,false,false,true,false,false],
                         [true,true,false,true,true,true,true,false,true,true],
                         [false,false,true,false,false,false,false,true,false,false]]''',
            'description': 'A period 15 oscillator',
            'category': 'preset'
        },
        {
            'name': 'Glider',
            'pattern': '[[false,true,false],[false,false,true],[true,true,true]]',
            'description': 'A classic diagonal spaceship',
            'category': 'preset'
        },
        {
            'name': 'Lightweight Spaceship',
            'pattern': '[[false,true,true,true,true],[true,false,false,false,true],[false,false,false,false,true],[true,false,false,true,false]]',
            'description': 'A horizontal spaceship',
            'category': 'preset'
        },
        {
            'name': 'Middleweight Spaceship',
            'pattern': '[[false,false,true,true,true,true],[false,true,false,false,false,true],[false,false,false,false,false,true],[true,false,false,false,true,false],[false,false,true,false,false,false]]',
            'description': 'A medium-sized spaceship',
            'category': 'preset'
        },
        {
            'name': 'Heavyweight Spaceship',
            'pattern': '[[false,false,true,true,true,true,true],[false,true,false,false,false,false,true],[false,false,false,false,false,false,true],[true,false,false,false,false,true,false],[false,false,true,true,false,false,false]]',
            'description': 'A large spaceship',
            'category': 'preset'
        }
    ]

    # Add preset templates
    for template in preset_templates:
        db.session.add(GameTemplate(**template))

    # Generate sample statistics
    base_time = datetime.now() - timedelta(days=1)
    for i in range(24):  # Last 24 hours of data
        stats = GameStatistics(
            generation=i * 10,
            alive_cells=50 + (i % 20),  # Random-like variation
            total_time=i * 300,  # 5 minutes per entry
            created_at=base_time + timedelta(hours=i)
        )
        db.session.add(stats)

    # Commit all changes
    db.session.commit()
    click.echo('Seed data initialized successfully.')

def init_app(app):
    app.cli.add_command(reset_migration_command)
    app.cli.add_command(sync_db_command)
    app.cli.add_command(seed_data_command)
