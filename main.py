#!/usr/bin/env python3
"""
Servidor Flask para Amigo Invisible BogoBogoSort
Sirve la aplicación y envía emails con las asignaciones
"""

import os
import smtplib

from flask_cors import CORS
from datetime import datetime
from dotenv import load_dotenv
from email.header import Header
from email.utils import formataddr
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import Flask, send_from_directory, request, jsonify

load_dotenv() 


app = Flask(__name__, static_folder='build')
CORS(app)


# Configuración de email (ajusta según tu proveedor)
EMAIL_CONFIG = {
    'smtp_server': os.getenv('SMTP_SERVER', 'smtp.gmail.com'),
    'smtp_port': int(os.getenv('SMTP_PORT', '587')),
    'email': os.getenv('EMAIL_USER', 'tu-email@gmail.com'),
    'password': os.getenv('EMAIL_PASSWORD', 'tu-contraseña-o-app-password'),
    'from_name': 'Amigo Invisible'
}


def create_email_html(giver_name, receiver_name):
    """Crea el HTML del email personalizado"""
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{
                font-family: Arial, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 20px;
            }}
            .container {{
                max-width: 600px;
                margin: 0 auto;
                background: white;
                border-radius: 15px;
                padding: 40px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            }}
            h1 {{
                color: #667eea;
                text-align: center;
                margin-bottom: 30px;
            }}
            .gift-box {{
                text-align: center;
                font-size: 60px;
                margin: 20px 0;
            }}
            .message {{
                font-size: 18px;
                line-height: 1.6;
                color: #333;
                text-align: center;
            }}
            .receiver {{
                font-size: 32px;
                font-weight: bold;
                color: #764ba2;
                text-align: center;
                margin: 30px 0;
                padding: 20px;
                background: linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%);
                border-radius: 10px;
            }}
            .footer {{
                text-align: center;
                margin-top: 30px;
                font-size: 14px;
                color: #666;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🎄 Amigo Invisible 🎁</h1>
            <div class="gift-box">🎁</div>
            <p class="message">
                ¡Hola <strong>{giver_name}</strong>!
            </p>
            <p class="message">
                El algoritmo BogoBogoSort ha decidido que este año tu amigo invisible es:
            </p>
            <div class="receiver">
                {receiver_name}
            </div>
            <p class="message">
                ¡Recuerda mantenerlo en secreto! 🤫
            </p>
            <p class="message">
                ¡Que disfrutes eligiendo el regalo perfecto!
            </p>
            <div class="footer">
                <p>Generado con caos matemático por BogoBogoSort 🎲</p>
                <p style="font-size: 12px; margin-top: 10px;">
                    {datetime.now().strftime('%d de %B de %Y')}
                </p>
            </div>
        </div>
    </body>
    </html>
    """


def send_email(to_email, to_name, receiver_name):
    """Envía un email a un participante con su asignación"""
    try:
        msg = MIMEMultipart('alternative')
        
        # 1. Codificar el Asunto (Subject) para soportar UTF-8 (emojis, tildes)
        subject = f'Tu Amigo Invisible ha sido asignado'
        msg['Subject'] = Header(subject, 'utf-8')
        
        # 2. Codificar el nombre del Remitente (From)
        from_display_name = EMAIL_CONFIG['from_name']
        from_email = EMAIL_CONFIG['email']
        msg['From'] = formataddr((str(Header(from_display_name, 'utf-8')), from_email))
        
        # El email del destinatario es ASCII
        msg['To'] = to_email

        # Crear versión texto plano
        text_content = f"""
        ¡Hola {to_name}!
        
        El algoritmo BogoBogoSort ha decidido que tu amigo invisible es: {receiver_name}
        
        ¡Recuerda mantenerlo en secreto!
        
        ¡Que disfrutes eligiendo el regalo perfecto!
        """

        # Crear versión HTML
        html_content = create_email_html(to_name, receiver_name)

        # Explicitamente con charset='utf-8' para el cuerpo (parte del fix anterior)
        part1 = MIMEText(text_content, 'plain', 'utf-8')
        part2 = MIMEText(html_content, 'html', 'utf-8')
        
        msg.attach(part1)
        msg.attach(part2)

        # Enviar email
        with smtplib.SMTP(EMAIL_CONFIG['smtp_server'], EMAIL_CONFIG['smtp_port']) as server:
            server.starttls()
            server.login(EMAIL_CONFIG['email'], EMAIL_CONFIG['password'])
            server.send_message(msg)
        
        return True
    except Exception as e:
        print(f"Error enviando email a {to_email}: {str(e)}")
        return False


@app.route('/')
def serve_index():
    """Sirve el archivo HTML principal"""
    return send_from_directory('build', 'index.html')


@app.route('/<path:filename>')
def serve_build(filename):
    return send_from_directory(app.static_folder, filename)


@app.route('/api/send-assignments', methods=['POST'])
def send_assignments():
    """
    Endpoint para enviar los emails
    Espera un JSON con formato:
    {
        "assignments": [
            {"giver": "Ana", "giverEmail": "ana@example.com", "receiver": "Luis"},
            ...
        ]
    }
    """
    try:
        data = request.json
        assignments = data.get('assignments', [])
        
        if not assignments:
            return jsonify({'error': 'No se proporcionaron asignaciones'}), 400
        
        results = []
        successful = 0
        failed = 0
        
        for assignment in assignments:
            giver_name = assignment['giver']
            giver_email = assignment['giverEmail']
            receiver_name = assignment['receiver']
            
            success = send_email(giver_email, giver_name, receiver_name)
            
            results.append({
                'giver': giver_name,
                'email': giver_email,
                'success': success
            })
            
            if success:
                successful += 1
            else:
                failed += 1
        
        return jsonify({
            'message': f'Emails enviados: {successful} exitosos, {failed} fallidos',
            'successful': successful,
            'failed': failed,
            'details': results
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/test-email', methods=['POST'])
def test_email():
    """
    Endpoint para probar la configuración de email
    Espera: {"email": "test@example.com", "name": "Test"}
    """
    try:
        data = request.json
        email = data.get('email')
        name = data.get('name', 'Usuario de prueba')
        
        if not email:
            return jsonify({'error': 'Email requerido'}), 400
        
        success = send_email(email, name, "Persona de Prueba")
        
        if success:
            return jsonify({'message': 'Email de prueba enviado correctamente'})
        else:
            return jsonify({'error': 'Error al enviar el email de prueba'}), 500
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/health')
def health_check():
    """Endpoint de comprobación de estado"""
    return jsonify({'status': 'ok', 'timestamp': datetime.now().isoformat()})


if __name__ == '__main__':
    print("=" * 60)
    print("🎁 Servidor Amigo Invisible BogoBogoSort")
    print("=" * 60)
    print("\n📧 Configuración de Email:")
    print(f"   Servidor SMTP: {EMAIL_CONFIG['smtp_server']}:{EMAIL_CONFIG['smtp_port']}")
    print(f"   Email: {EMAIL_CONFIG['email']}")
    print(f"   Password: {'✓ Configurado' if EMAIL_CONFIG['password'] != 'tu-contraseña-o-app-password' else '✗ NO configurado'}")
    print("\n🌐 Endpoints disponibles:")
    print("   GET  /                      - Aplicación web")
    print("   POST /api/send-assignments  - Enviar emails con asignaciones")
    print("   POST /api/test-email        - Probar envío de email")
    print("   GET  /api/health            - Estado del servidor")
    print("\n" + "=" * 60)
    print("\n🚀 Servidor iniciando en http://localhost:8080\n")
    
    app.run(debug=True, host='0.0.0.0', port=8080)
