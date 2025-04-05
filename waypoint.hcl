project = "bolt-diy"

app "bolt-diy" {
  labels = {
    "service" = "bolt-diy",
    "env"     = "production"
  }

  build {
    use "docker" {
      dockerfile = "${path.app}/Dockerfile"
      target     = "bolt-ai-production"
    }
    
    registry {
      use "docker" {
        image = "bolt-ai"
        tag   = "production"
        local = true
      }
    }
  }

  deploy {
    use "nomad-jobspec" {
      jobspec = file("${path.app}/nomad/bolt.nomad.hcl")
    }
  }

  release {
    use "nomad-jobspec-canary" {
      groups = ["bolt-app"]
      
      // Canary count is the number of allocations that should be updated at once
      canary_count = 5
      
      // Auto promote determines if waypoint should automatically promote the deployment
      auto_promote = true
      
      // Auto revert determines if waypoint should automatically revert the deployment if it fails
      auto_revert = true
      
      // The amount of time to wait between updating allocations
      stagger = "30s"
    }
  }
}