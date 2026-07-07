import logging
from abc import ABC


class BaseService(ABC):
    def __init__(self):
        self.logger = logging.getLogger(f"smarthire.{self.__class__.__module__}")
