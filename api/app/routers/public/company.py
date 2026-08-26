"""公开接口：公司介绍（单行，JSON 字段自动解析）。

契约依据：开发技术文档 v1.7 §3.3.7。
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import CompanyInfo
from app.schemas import CompanyOut
from app.utils.response import ok

router = APIRouter(prefix="/company", tags=["public-company"])


@router.get("")
def get_company(db: Session = Depends(get_db)):
    info = db.execute(select(CompanyInfo).where(CompanyInfo.id == 1)).scalar_one_or_none()
    if info is None:
        raise HTTPException(status_code=404, detail="公司介绍未初始化")
    return ok(CompanyOut.model_validate(info, from_attributes=True).model_dump())
