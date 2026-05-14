# All of the Gear

Ski trip packing tracker. Track which items go in which bag, monitor packed status, and analyze weight distribution across categories.

## Using the app

The app has three tabs:

- **Packing** — mark items as packed by clicking a row, assign items to bags (Ski, Duffel, Carry-on), and track progress per category
- **Analysis** — treemap and category breakdown showing weight distribution
- **Catalog** — view and edit all items (name, weight, quantity), sortable and filterable

## Local development

**Requirements:** Node.js 20+

```bash
npm install
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:3001

The SQLite database is created automatically at `data/gear.db` on first run and seeded from `gear.csv`.

## Deployment

The app is deployed to a Google Compute Engine VM using Docker. GitHub Actions builds and pushes a Docker image to GitHub Container Registry (GHCR) on every push to `main`, then SSHs into the VM to redeploy.

### VM setup

**1. Create the VM**

```bash
gcloud compute instances create allofthegear \
  --machine-type=e2-micro \
  --zone=us-west1-b \
  --image-family=debian-12 \
  --image-project=debian-cloud \
  --boot-disk-size=30GB \
  --tags=http-server

gcloud compute firewall-rules create allow-http \
  --allow=tcp:80 \
  --target-tags=http-server
```

**2. Install Docker**

```bash
sudo apt install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc
echo "deb [arch=amd64 signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian bookworm stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin git
sudo usermod -aG docker $USER && newgrp docker
```

**3. Configure and start**

```bash
# Authenticate with GHCR (GitHub PAT with read:packages scope)
echo YOUR_PAT | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin

git clone https://github.com/YOUR_USERNAME/allofthegear.git ~/allofthegear
cd ~/allofthegear

cat > .env << 'EOF'
APP_IMAGE=ghcr.io/YOUR_USERNAME/allofthegear:latest
EOF

docker compose pull
docker compose up -d
```

### GitHub Actions setup

Add these secrets to the repo (Settings → Secrets → Actions):

| Secret | Value |
|---|---|
| `VM_HOST` | VM external IP |
| `VM_USER` | SSH username |
| `VM_SSH_KEY` | Contents of `~/.ssh/google_compute_engine` |

### Data persistence

The SQLite database is stored in a Docker named volume (`sqlite_data`) on the VM's persistent disk and survives redeploys.
