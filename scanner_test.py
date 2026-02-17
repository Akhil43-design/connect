import cv2
from pyzbar.pyzbar import decode
import time
import numpy as np

def start_scanner():
    # Initialize camera
    # 0 is usually the default webcam
    cap = cv2.VideoCapture(0)
    
    # Set window size
    cap.set(3, 640) # Width
    cap.set(4, 480) # Height

    print("Scanner started... Press 'q' to quit.")

    while True:
        # Read frame
        success, frame = cap.read()
        
        if not success:
            print("Failed to access camera")
            break

        # Decode QR codes
        decoded_objects = decode(frame)
        
        for obj in decoded_objects:
            # Get data
            qr_data = obj.data.decode('utf-8')
            qr_type = obj.type
            
            # Print to console
            print(f"Found {qr_type}: {qr_data}")
            
            # Draw rectangle
            points = obj.polygon
            if len(points) == 4:
                pts = np.array(points, np.int32)
                pts = pts.reshape((-1, 1, 2))
                cv2.polylines(frame, [pts], True, (0, 255, 0), 2)

            # Draw text
            pts2 = obj.rect
            cv2.putText(frame, qr_data, (pts2.left, pts2.top - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

        # Show preview
        cv2.imshow('QR Code Scanner (Python)', frame)

        # Exit on 'q'
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    # Cleanup
    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    start_scanner()
