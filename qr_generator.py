import qrcode
import os
import io
import base64

class QRGenerator:
    def __init__(self, base_url="https://connect-delta-teal.vercel.app"):
        # Update base_url to the deployed URL or keep dynamic
        self.base_url = base_url
        # No need for qr_dir anymore
    
    def generate_product_qr(self, store_id, product_id):
        """
        Generate QR code for a product
        Returns the Base64 Data URI of the QR code image
        """
        # Construct product URL (Relative path for simpler QR code)
        product_url = f"/store/{store_id}/product/{product_id}"
        
        # Create QR code
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(product_url)
        qr.make(fit=True)
        
        # Create image
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Save to memory buffer
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        buffer.seek(0)
        
        # Encode to base64
        img_str = base64.b64encode(buffer.getvalue()).decode('utf-8')
        
        # Return Data URI
        return f"data:image/png;base64,{img_str}"

    def generate_qr_stream(self, data_payload):
        """
        Generate QR code stream from data payload (JSON or URL)
        """
        import json
        
        # If data is a dictionary (product info), convert to JSON string
        # If it's already a string (URL), use as is
        if isinstance(data_payload, dict):
            qr_content = json.dumps(data_payload)
        else:
            qr_content = str(data_payload)
            
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(qr_content)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        buffer.seek(0)
        
        return buffer
