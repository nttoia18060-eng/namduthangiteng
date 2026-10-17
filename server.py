import http.server
import socketserver
import json
import os
import csv
import sys
from datetime import datetime

try:
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
except Exception:
    pass

PORT = 5500
SUBMISSIONS_JSON = os.path.join(os.path.dirname(__file__), 'survey_submissions.json')
SUBMISSIONS_CSV = os.path.join(os.path.dirname(__file__), 'survey_submissions.csv')

class SurveyHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        if self.path == '/api/submissions':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            submissions = []
            if os.path.exists(SUBMISSIONS_JSON):
                try:
                    with open(SUBMISSIONS_JSON, 'r', encoding='utf-8') as f:
                        submissions = json.load(f)
                except Exception:
                    submissions = []
            self.wfile.write(json.dumps(submissions, ensure_ascii=False).encode('utf-8'))
            return
        elif self.path == '/api/stats':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            submissions = []
            if os.path.exists(SUBMISSIONS_JSON):
                try:
                    with open(SUBMISSIONS_JSON, 'r', encoding='utf-8') as f:
                        submissions = json.load(f)
                except Exception:
                    submissions = []
            
            # Compute stats
            total = len(submissions)
            question_stats = {}
            respondents = []
            for sub in submissions:
                resp_info = sub.get('respondent', {})
                respondents.append({
                    'name': resp_info.get('name', ''),
                    'department': resp_info.get('department', ''),
                    'submittedAt': resp_info.get('submittedAt', '')
                })
                for ans in sub.get('answers', []):
                    idx = ans.get('index', ans.get('id', ''))
                    q_text = ans.get('question', '')
                    opt = ans.get('chosenOption', '')
                    opt_text = ans.get('chosenText', '')
                    key = str(idx)
                    if key not in question_stats:
                        question_stats[key] = {
                            'index': idx,
                            'question': q_text,
                            'total': 0,
                            'options': {}
                        }
                    question_stats[key]['total'] += 1
                    if opt not in question_stats[key]['options']:
                        question_stats[key]['options'][opt] = {
                            'count': 0,
                            'sampleText': opt_text,
                            'voters': []
                        }
                    question_stats[key]['options'][opt]['count'] += 1
                    question_stats[key]['options'][opt]['voters'].append(resp_info.get('name', 'Ẩn danh'))

            stats_data = {
                'totalRespondents': total,
                'respondents': respondents,
                'questions': question_stats
            }
            self.wfile.write(json.dumps(stats_data, ensure_ascii=False).encode('utf-8'))
            return

        super().do_GET()

    def do_POST(self):
        if self.path == '/api/submit':
            try:
                content_length = int(self.headers.get('Content-Length', 0))
                body = self.rfile.read(content_length).decode('utf-8')
                data = json.loads(body)

                # Save to JSON array file
                all_submissions = []
                if os.path.exists(SUBMISSIONS_JSON):
                    try:
                        with open(SUBMISSIONS_JSON, 'r', encoding='utf-8') as f:
                            all_submissions = json.load(f)
                    except Exception:
                        all_submissions = []
                
                all_submissions.append(data)
                with open(SUBMISSIONS_JSON, 'w', encoding='utf-8') as f:
                    json.dump(all_submissions, f, ensure_ascii=False, indent=2)

                # Save summary to CSV file
                file_exists = os.path.exists(SUBMISSIONS_CSV)
                with open(SUBMISSIONS_CSV, 'a', encoding='utf-8-sig', newline='') as f:
                    writer = csv.writer(f)
                    if not file_exists:
                        header = ['Thời gian', 'Tên', 'Biệt danh', 'Góp ý']
                        answers = data.get('answers', [])
                        for a in answers:
                            header.append(f"Câu {a.get('index', '')}: {a.get('question', '')[:30]}")
                        writer.writerow(header)
                    
                    row = [
                        data.get('respondent', {}).get('submittedAt', datetime.now().strftime('%Y-%m-%d %H:%M:%S')),
                        data.get('respondent', {}).get('name', ''),
                        data.get('respondent', {}).get('department', ''),
                        data.get('feedback', '')
                    ]
                    for a in data.get('answers', []):
                        row.append(f"[{a.get('chosenOption', '')}] {a.get('chosenText', '')}")
                    writer.writerow(row)

                print(f"[OK] Đã lưu bài khảo sát của: {data.get('respondent', {}).get('name')} lúc {datetime.now().strftime('%H:%M:%S')}")

                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'success': True, 'message': 'Saved locally'}).encode('utf-8'))
            except Exception as e:
                print(f"[ERROR] Lưu bài khảo sát thất bại: {e}")
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'success': False, 'error': str(e)}).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

if __name__ == '__main__':
    # Allow port reuse immediately
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), SurveyHandler) as httpd:
        print(f"🚀 Survey Server đang chạy tại http://localhost:{PORT}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")
