import re

def is_allowed_origin(origin: str) -> bool:
    if not origin:
        return False
    # Allow all Vercel preview deployments for this project
    if re.match(r'https://architech-saas-app-tracker.*\.vercel\.app', origin):
        return True
    # Allow localhost for dev
    if origin in ['http://localhost:5173', 'http://localhost:3000']:
        return True
    return False
