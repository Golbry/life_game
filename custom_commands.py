import shutil
import re
import os
from sqlalchemy import text
from pathlib import Path
from flask import current_app
from datetime import datetime

def cmd_reset_migration():
    """重置数据库迁移"""
    # 获取 db 对象
    db = current_app.extensions['sqlalchemy']

    # 1. 删除migrations目录
    migrations_path = Path(current_app.root_path) / 'migrations'
    if migrations_path.exists():
        shutil.rmtree(migrations_path)

    # 2. 删除alembic_version表
    with db.engine.connect() as conn:
        conn.execute(text("DROP TABLE IF EXISTS alembic_version;"))

def fix_migration_file():
    """修复迁移文件中的必填字段默认值"""
    migrations_path = Path(current_app.root_path) / 'migrations'
    versions_dir = migrations_path / 'versions'

    db_uri = os.getenv('FLASK_SQLALCHEMY_DATABASE_URI', '')
    is_mysql = 'mysql' in db_uri.lower()

    for file_path in versions_dir.glob('*.py'):
        content = Path(file_path).read_text()
        pattern = r"sa\.Column\('(\w+)',\s*sa\.(\w+)[\w()]*,\s*nullable=False"

        def get_default_value(column_name, column_type):
            # MySQL 特殊处理
            if is_mysql:
                # 主键列不设置默认值
                if column_name == 'id' and column_type == 'Integer':
                    return None
                # TEXT 类型不能设置默认值
                if column_type == 'Text':
                    return None
            else:
                # 其他数据库（如 SQLite）允许设置默认值
                if column_type == 'Text':
                    return "''"
            defaults = {
                'Integer': "'0'",
                'Float': "'0.0'",
                'String': "''",
                'Boolean': "'0'",
                'DateTime': "CURRENT_TIMESTAMP",
                'Date': "(CURDATE())" if is_mysql else "CURRENT_DATE",
            }
            return defaults.get(column_type, "'0'")

        def replacement(match):
            column_name, column_type = match.groups()
            default_value = get_default_value(column_name, column_type)

            # MySQL 中主键需要明确设置自增
            if is_mysql and column_name == 'id' and column_type == 'Integer':
                return f"sa.Column('{column_name}', sa.{column_type}, autoincrement=True, nullable=False"

            if default_value is None:
                return f"sa.Column('{column_name}', sa.{column_type}, nullable=False"

            if column_type in ('DateTime', 'Date'):
                return f"sa.Column('{column_name}', sa.{column_type}, nullable=False, server_default=sa.text('{default_value}')"

            return f"sa.Column('{column_name}', sa.{column_type}, nullable=False, server_default={default_value}"

        modified_content = re.sub(pattern, replacement, content)
        Path(file_path).write_text(modified_content)

def cmd_sync_db():
    """同步数据库结构"""
    from flask_migrate import init, migrate, upgrade

    # 1. 初始化新的迁移
    init()
    migrate(message=f"Auto migration {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    # 2. 修复迁移文件
    fix_migration_file()

    # 3. 应用迁移
    upgrade()