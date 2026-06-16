import urllib.request
import urllib.error
import json

def test_request():
    url = "http://127.0.0.1:8000/ats_analyze"
    payload = {
        "file_id": "0dc51fda",
        "target_role": "software engineer",
        "experience_level": "Fresher",
        "job_description": ""
    }
    
    req = urllib.request.Request(
        url, 
        data=json.dumps(payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    
    print("Sending POST request to /ats_analyze...")
    try:
        with urllib.request.urlopen(req) as response:
            res_body = response.read().decode('utf-8')
            print("Response code: 200")
            print(json.dumps(json.loads(res_body), indent=2))
    except urllib.error.HTTPError as e:
        print(f"HTTP Error {e.code}")
        print(e.read().decode('utf-8'))
    except Exception as e:
        print(f"Failed to connect: {str(e)}")

if __name__ == "__main__":
    test_request()
