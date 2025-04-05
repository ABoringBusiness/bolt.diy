job "bolt-diy" {
  datacenters = ["dc1"]
  type        = "service"

  group "bolt-app" {
    count = 200  # Scale to 200 instances

    network {
      port "http" {
        to = 5173
      }
    }

    service {
      name = "bolt-diy"
      port = "http"
      
      tags = [
        "traefik.enable=true",
        "traefik.http.routers.bolt.rule=Host(`bolt.example.com`)",
      ]

      check {
        type     = "http"
        path     = "/health"
        interval = "10s"
        timeout  = "2s"
      }
    }

    task "bolt" {
      driver = "docker"

      config {
        image = "bolt-ai:production"
        ports = ["http"]
      }

      env {
        NODE_ENV = "production"
        RUNNING_IN_DOCKER = "true"
        INSTANCE_ID = "${NOMAD_ALLOC_INDEX}"
      }

      template {
        data = <<EOH
{{ with secret "secret/bolt-diy" }}
GITHUB_ACCESS_TOKEN={{ .Data.github_token }}
VITE_GITHUB_ACCESS_TOKEN={{ .Data.github_token }}
OPENAI_API_KEY={{ .Data.openai_key }}
ANTHROPIC_API_KEY={{ .Data.anthropic_key }}
{{ end }}
EOH
        destination = "secrets/env.vars"
        env         = true
      }

      resources {
        cpu    = 500
        memory = 512
      }
    }

    scaling {
      enabled = true
      min     = 50
      max     = 250
      
      policy {
        cooldown = "1m"
        
        check "cpu" {
          source = "prometheus"
          query  = "avg(nomad_client_allocs_cpu_total_percent{task='bolt'})"
          
          strategy "target-value" {
            target = 70
          }
        }
      }
    }
  }

  group "nginx" {
    count = 1

    network {
      port "http" {
        static = 80
      }
      port "https" {
        static = 443
      }
    }

    service {
      name = "bolt-nginx"
      port = "http"
      
      tags = [
        "traefik.enable=true",
        "traefik.http.routers.bolt-nginx.rule=Host(`bolt.example.com`)",
      ]
    }

    task "nginx" {
      driver = "docker"

      config {
        image = "nginx:latest"
        ports = ["http", "https"]
        
        volumes = [
          "local/nginx.conf:/etc/nginx/nginx.conf:ro",
        ]
      }

      template {
        data = <<EOF
events {
  worker_connections 1024;
}

http {
  upstream bolt_servers {
    {{range service "bolt-diy"}}
    server {{.Address}}:{{.Port}};
    {{end}}
  }
  
  server {
    listen 80;
    server_name localhost;
    
    location / {
      proxy_pass http://bolt_servers;
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection 'upgrade';
      proxy_set_header Host $host;
      proxy_cache_bypass $http_upgrade;
    }
    
    location /health {
      proxy_pass http://bolt_servers/health;
      access_log off;
      add_header Cache-Control no-cache;
    }
  }
}
EOF
        destination = "local/nginx.conf"
      }

      resources {
        cpu    = 100
        memory = 128
      }
    }
  }
}