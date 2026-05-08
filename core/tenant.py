from fastapi import HTTPException

def get_company_from_token(decoded_token: dict):
    
    email = decoded_token.get("email")

    if not email:
        return None

    try:
        domain = email.split("@")[1]
        company_name = domain.split(".")[0]
        return f"hrms_{company_name}"
    except:
        return None