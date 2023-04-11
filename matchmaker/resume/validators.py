
from pydantic import validator


class DistanceValidator(str):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if v not in {'l2', 'cosine'}:
            raise ValueError("Distance must be 'l2' or 'cosine'")
        return v