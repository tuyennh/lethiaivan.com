# Hướng dẫn đưa website lên EC2

Sau khi cài đặt xong, mỗi lần code được merge vào nhánh `main`, GitHub Actions tự đẩy website lên server.

## Bước 1. Tạo EC2
- AMI: **Ubuntu 24.04 LTS**. Loại máy: `t3.micro` hoặc `t4g.micro` là đủ.
- Key pair: tạo mới, tải file `.pem` về và giữ kỹ.
- Security group, mở các cổng:
  - **22 (SSH)**: chỉ IP của bạn. Nếu dùng GitHub Actions thì phải mở cho mọi IP, hoặc dùng SSH key riêng (xem lưu ý cuối).
  - **80 (HTTP)** và **443 (HTTPS)**: mở cho mọi IP (0.0.0.0/0).
- Gắn **Elastic IP** để IP không đổi khi khởi động lại máy.

## Bước 2. Trỏ tên miền
Tại nơi mua tên miền, tạo 2 bản ghi:

| Loại | Tên | Giá trị |
|------|-----|---------|
| A | @ | Elastic IP của EC2 |
| A | www | Elastic IP của EC2 |

Đợi 5–30 phút. Kiểm tra bằng lệnh `ping lethiaivan.com`: thấy đúng IP là được.

## Bước 3. Cài server (làm một lần)
Trên máy của bạn:
```bash
scp -i key.pem -r deploy ubuntu@<ELASTIC_IP>:~/
ssh -i key.pem ubuntu@<ELASTIC_IP>
sudo bash deploy/setup-server.sh email-cua-ban@gmail.com
```
Script sẽ cài nginx, tạo thư mục `/var/www/lethiaivan.com`, xin chứng chỉ HTTPS miễn phí (tự gia hạn) và chuyển `www` về tên miền chính.

## Bước 4. Tạo SSH key riêng cho GitHub
Vẫn trên server:
```bash
ssh-keygen -t ed25519 -f ~/.ssh/github_deploy -N "" -C "github-deploy"
cat ~/.ssh/github_deploy.pub >> ~/.ssh/authorized_keys
cat ~/.ssh/github_deploy      # copy toàn bộ nội dung (private key) cho bước 5
```

## Bước 5. Thêm secrets trên GitHub
Vào repo → **Settings → Secrets and variables → Actions → New repository secret**:

| Tên | Giá trị |
|-----|---------|
| `EC2_HOST` | Elastic IP (hoặc `lethiaivan.com`) |
| `EC2_USER` | `ubuntu` |
| `EC2_SSH_KEY` | Nội dung private key ở bước 4 (gồm cả dòng BEGIN/END) |

Workflow dùng environment `production`. GitHub tự tạo environment này ở lần chạy đầu. Nếu muốn mỗi lần deploy phải bấm duyệt, vào **Settings → Environments → production** và bật *Required reviewers*.

## Bước 6. Deploy
- Merge pull request vào `main`, hoặc
- Vào tab **Actions → Deploy to EC2 → Run workflow**.

Mở https://lethiaivan.com để kiểm tra.

## Lưu ý bảo mật
- **Không** gửi file `.pem` hay private key qua chat hoặc email. Chỉ dán vào GitHub Secrets.
- GitHub Actions chạy từ nhiều IP khác nhau, nên cổng 22 phải mở rộng. Để an toàn hơn: tắt đăng nhập bằng mật khẩu (Ubuntu trên EC2 đã tắt sẵn) và chỉ dùng SSH key.
- Muốn thêm `aivanhr.com` chuyển về `lethiaivan.com`: trỏ DNS của tên miền đó về cùng IP rồi báo lại để thêm cấu hình chuyển hướng.
