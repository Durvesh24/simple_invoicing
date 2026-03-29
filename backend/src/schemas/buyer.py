from pydantic import BaseModel, field_validator

from src.core.validation import normalize_gstin


class BuyerCreate(BaseModel):
    name: str
    address: str
    gst: str
    phone_number: str
    email: str | None = None
    website: str | None = None
    bank_name: str | None = None
    branch_name: str | None = None
    account_name: str | None = None
    account_number: str | None = None
    ifsc_code: str | None = None

    @field_validator("gst")
    @classmethod
    def validate_gst(cls, value: str) -> str:
        normalized = normalize_gstin(value)
        if normalized is None:
            raise ValueError("GSTIN is required")
        return normalized


class BuyerOut(BaseModel):
    id: int
    name: str
    address: str
    gst: str
    phone_number: str
    email: str | None = None
    website: str | None = None
    bank_name: str | None = None
    branch_name: str | None = None
    account_name: str | None = None
    account_number: str | None = None
    ifsc_code: str | None = None

    class Config:
        from_attributes = True
