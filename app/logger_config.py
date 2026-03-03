import logging
import sys

class LoggerSingleton:
    _instance = None

    @classmethod
    def get_logger(cls) -> logging.Logger:
        if cls._instance is None:
            logger = logging.getLogger("ai-therapist-matcher")
            logger.setLevel(logging.INFO)

            formatter = logging.Formatter(
                "%(asctime)s | %(levelname)s | %(name)s | %(message)s"
            )

            handler = logging.StreamHandler(sys.stdout)
            handler.setFormatter(formatter)

            if not logger.handlers:
                logger.addHandler(handler)

            logger.propagate = False

            cls._instance = logger

        return cls._instance


logger = LoggerSingleton.get_logger()