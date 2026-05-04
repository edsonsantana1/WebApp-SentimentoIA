import pytest
from app.services.auth_service import AuthService
from app.models import UserRole

class TestAuthService:
    """Testes para o serviço de autenticação"""
    
    def test_hash_password(self):
        """Testa hash de senha"""
        password = "test_password_123"
        hashed = AuthService.hash_password(password)
        
        assert hashed != password
        assert len(hashed) > 20
        assert AuthService.verify_password(password, hashed)
    
    def test_verify_password_invalid(self):
        """Testa verificação de senha inválida"""
        password = "test_password_123"
        wrong_password = "wrong_password"
        hashed = AuthService.hash_password(password)
        
        assert not AuthService.verify_password(wrong_password, hashed)
    
    def test_create_access_token(self):
        """Testa criação de token JWT"""
        user_id = "user_123"
        role = UserRole.USER
        token = AuthService.create_access_token(user_id, role)
        
        assert token is not None
        assert len(token) > 0
        
        # Verificar token
        token_data = AuthService.verify_token(token)
        assert token_data is not None
        assert token_data.sub == user_id
        assert token_data.role == role
    
    def test_verify_invalid_token(self):
        """Testa verificação de token inválido"""
        invalid_token = "invalid.token.here"
        token_data = AuthService.verify_token(invalid_token)
        
        assert token_data is None
    
    def test_setup_mfa(self):
        """Testa setup de MFA"""
        user_email = "test@example.com"
        secret, qr_code = AuthService.setup_mfa(user_email)
        
        assert secret is not None
        assert len(secret) > 0
        assert qr_code is not None
    
    def test_verify_mfa_token(self):
        """Testa verificação de token MFA"""
        import pyotp
        
        secret = pyotp.random_base32()
        totp = pyotp.TOTP(secret)
        token = totp.now()
        
        # Verificar token válido
        assert AuthService.verify_mfa_token(secret, token)
        
        # Verificar token inválido
        assert not AuthService.verify_mfa_token(secret, "000000")

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
