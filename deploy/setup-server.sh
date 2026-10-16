#!/usr/bin/env bash
# One-time setup for an EC2 instance (Ubuntu 22.04/24.04 or Amazon Linux 2023).
# Usage on the server:  sudo bash setup-server.sh you@example.com
set -euo pipefail

DOMAIN="aivanhr.com"
WEBROOT="/var/www/${DOMAIN}"
EMAIL="${1:?Pass an email for SSL certificate notices, e.g. sudo bash setup-server.sh you@example.com}"
DEPLOY_USER="${SUDO_USER:-ubuntu}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "==> Installing nginx, certbot, rsync"
if command -v apt-get >/dev/null; then
  apt-get update -y
  apt-get install -y nginx certbot python3-certbot-nginx rsync
  SITES_DIR=/etc/nginx/sites-available
  ENABLED_DIR=/etc/nginx/sites-enabled
  rm -f /etc/nginx/sites-enabled/default
elif command -v dnf >/dev/null; then
  dnf install -y nginx certbot python3-certbot-nginx rsync
  SITES_DIR=/etc/nginx/conf.d
  ENABLED_DIR=""
else
  echo "Unsupported OS" >&2; exit 1
fi

echo "==> Creating web root ${WEBROOT} owned by ${DEPLOY_USER}"
mkdir -p "${WEBROOT}"
chown -R "${DEPLOY_USER}":"${DEPLOY_USER}" "${WEBROOT}"
chmod 755 "${WEBROOT}"
if [ ! -f "${WEBROOT}/index.html" ]; then
  echo "<!doctype html><meta charset=utf-8><title>${DOMAIN}</title><p>Đang cập nhật…</p>" > "${WEBROOT}/index.html"
  chown "${DEPLOY_USER}":"${DEPLOY_USER}" "${WEBROOT}/index.html"
fi

echo "==> Installing nginx site config"
if [ -n "${ENABLED_DIR}" ]; then
  cp "${SCRIPT_DIR}/nginx-${DOMAIN}.conf" "${SITES_DIR}/${DOMAIN}"
  ln -sf "${SITES_DIR}/${DOMAIN}" "${ENABLED_DIR}/${DOMAIN}"
else
  cp "${SCRIPT_DIR}/nginx-${DOMAIN}.conf" "${SITES_DIR}/${DOMAIN}.conf"
fi
nginx -t
systemctl enable --now nginx
systemctl reload nginx

echo "==> Requesting HTTPS certificate (DNS for ${DOMAIN} and www.${DOMAIN} must already point to this server)"
certbot --nginx --non-interactive --agree-tos --redirect -m "${EMAIL}" -d "${DOMAIN}" -d "www.${DOMAIN}"

systemctl enable --now certbot.timer 2>/dev/null || true
echo "==> Done. Visit https://${DOMAIN}"
