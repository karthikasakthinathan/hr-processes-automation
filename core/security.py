import firebase_admin
from firebase_admin import credentials, auth
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from core.company_setup import setup_company_database
from core.tenant import get_company_from_token


# ================= FIREBASE INIT =================
try:
    if not firebase_admin._apps:
        cred = credentials.Certificate("firebase-service-account.json")
        firebase_admin.initialize_app(cred)
        print("Firebase Admin Initialized")
except Exception as e:
    print("Firebase Init Error:", e)


# ================= SECURITY =================
security = HTTPBearer()


# ================= VERIFY TOKEN =================
def verify_firebase_token(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    try:

        # TOKEN MISSING
        if credentials is None:
            raise HTTPException(status_code=401, detail="Token Missing")

        id_token = credentials.credentials

        if not id_token:
            raise HTTPException(status_code=401, detail="Token Empty")

        # VERIFY FIREBASE TOKEN
        decoded_token = auth.verify_id_token(
            id_token,
            check_revoked=False
        )

        print("TOKEN VERIFIED")
        print("UID:", decoded_token.get("uid"))

        # MULTI COMPANY SAFE
        try:
            company_code = get_company_from_token(decoded_token)

            if company_code:
                setup_company_database(company_code)
                print("COMPANY:", company_code)
            else:
                print("Company code missing")

        except Exception as tenant_error:
            print("Tenant error:", tenant_error)

        return decoded_token

    except Exception as e:
        print("AUTH FAILED:", e)
        raise HTTPException(status_code=401, detail="Invalid Token")