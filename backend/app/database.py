import logging
from typing import Optional

from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError

from app.config import settings

logger = logging.getLogger(__name__)


class MongoDB:
    """Gerenciador de conexão MongoDB.

    Usa pymongo síncrono por simplicidade. Como as operações são pequenas no MVP,
    isso é suficiente. Para alta escala, migrar para Motor async.
    """

    client: Optional[MongoClient] = None
    db = None

    @classmethod
    async def connect_db(cls):
        """Conecta no MongoDB Atlas/local e cria índices."""
        try:
            cls.client = MongoClient(
                settings.MONGODB_URI,
                serverSelectionTimeoutMS=5000,
                connectTimeoutMS=10000,
                retryWrites=True,
                w="majority",
            )
            cls.client.admin.command("ping")
            cls.db = cls.client[settings.DATABASE_NAME]

            logger.info("✓ Conectado ao MongoDB com sucesso")
            await cls.create_indexes()

        except (ConnectionFailure, ServerSelectionTimeoutError) as exc:
            logger.error("✗ Erro ao conectar ao MongoDB: %s", exc)
            raise

    @classmethod
    async def close_db(cls):
        """Fecha conexão MongoDB."""
        if cls.client:
            cls.client.close()
            logger.info("✓ Conexão com MongoDB fechada")

    @classmethod
    async def create_indexes(cls):
        """Índices para performance e consistência por search_id."""
        if cls.db is None:
            return

        try:
            cls.db.users.create_index("email", unique=True)

            cls.db.search_jobs.create_index([("user_id", 1), ("created_at", -1)])
            cls.db.search_jobs.create_index("search_id", unique=True)
            cls.db.search_jobs.create_index([("user_id", 1), ("query", 1), ("created_at", -1)])

            cls.db.mentions.create_index([("user_id", 1), ("search_id", 1)])
            cls.db.mentions.create_index([("search_id", 1), ("published_at", -1)])
            cls.db.mentions.create_index("source")
            cls.db.mentions.create_index("sentiment")
            cls.db.mentions.create_index("criticality")

            cls.db.alerts.create_index([("user_id", 1), ("search_id", 1), ("created_at", -1)])
            cls.db.reports.create_index([("user_id", 1), ("search_id", 1), ("created_at", -1)])
            cls.db.audit_logs.create_index([("user_id", 1), ("created_at", -1)])

            logger.info("✓ Índices criados com sucesso")

        except Exception as exc:
            logger.error("✗ Erro ao criar índices: %s", exc)


def get_db():
    """Retorna instância ativa do MongoDB."""
    return MongoDB.db
