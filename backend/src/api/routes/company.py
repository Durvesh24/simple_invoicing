from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.api.deps import get_current_user, require_roles
from src.db.session import get_db
from src.models.company import CompanyProfile
from src.models.user import User, UserRole
from src.schemas.company import CompanyProfileOut, CompanyProfileUpdate

router = APIRouter()


def _get_or_create_company_profile(db: Session) -> CompanyProfile:
    profile = db.query(CompanyProfile).order_by(CompanyProfile.id.asc()).first()
    if profile:
        return profile

    profile = CompanyProfile(
        name="",
        address="",
        gst="",
        phone_number="",
        currency_code="USD",
        email="",
        website="",
        bank_name="",
        branch_name="",
        account_name="",
        account_number="",
        ifsc_code="",
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


@router.get("", response_model=CompanyProfileOut, include_in_schema=False)
@router.get("/", response_model=CompanyProfileOut)
def get_company_profile(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return _get_or_create_company_profile(db)


@router.put("", response_model=CompanyProfileOut, include_in_schema=False)
@router.put("/", response_model=CompanyProfileOut)
def upsert_company_profile(
    payload: CompanyProfileUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.admin, UserRole.manager)),
):
    profile = _get_or_create_company_profile(db)
    profile.name = payload.name.strip()
    profile.address = payload.address.strip()
    profile.gst = payload.gst.strip().upper()
    profile.phone_number = payload.phone_number.strip()
    profile.currency_code = payload.currency_code.strip().upper() if payload.currency_code else "USD"
    profile.email = payload.email.strip() if payload.email else None
    profile.website = payload.website.strip() if payload.website else None
    profile.bank_name = payload.bank_name.strip() if payload.bank_name else None
    profile.branch_name = payload.branch_name.strip() if payload.branch_name else None
    profile.account_name = payload.account_name.strip() if payload.account_name else None
    profile.account_number = payload.account_number.strip() if payload.account_number else None
    profile.ifsc_code = payload.ifsc_code.strip().upper() if payload.ifsc_code else None
    db.commit()
    db.refresh(profile)
    return profile