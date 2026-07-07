from abc import ABC, abstractmethod
from typing import Generic, Optional, TypeVar
from django.db.models import Model, QuerySet

T = TypeVar("T", bound=Model)


class AbstractRepository(ABC, Generic[T]):
    @abstractmethod
    def get_by_id(self, id_) -> Optional[T]: ...
    @abstractmethod
    def list(self, **filters) -> QuerySet: ...
    @abstractmethod
    def create(self, **kwargs) -> T: ...
    @abstractmethod
    def update(self, instance: T, **kwargs) -> T: ...
    @abstractmethod
    def delete(self, instance: T) -> None: ...


class DjangoModelRepository(AbstractRepository[T]):
    model: type[T]

    def __init__(self, model: type[T] | None = None):
        if model is not None:
            self.model = model

    def get_by_id(self, id_) -> Optional[T]:
        return self.model.objects.filter(pk=id_).first()

    def get_by_id_or_raise(self, id_) -> T:
        from core.exceptions import NotFoundError
        instance = self.get_by_id(id_)
        if instance is None:
            raise NotFoundError(f"{self.model.__name__} with id={id_} not found.")
        return instance

    def list(self, **filters) -> QuerySet:
        return self.model.objects.filter(**filters)

    def create(self, **kwargs) -> T:
        return self.model.objects.create(**kwargs)

    def update(self, instance: T, **kwargs) -> T:
        for field, value in kwargs.items():
            setattr(instance, field, value)
        instance.save(update_fields=list(kwargs.keys()) if kwargs else None)
        return instance

    def delete(self, instance: T) -> None:
        instance.delete()
