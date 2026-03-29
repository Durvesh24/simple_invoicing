from pydantic import BaseModel


class InventoryAdjust(BaseModel):
    product_id: int
    quantity: int


class InventoryOut(BaseModel):
    product_id: int
    product_name: str
    quantity: int
