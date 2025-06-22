provider "google" {
  project = "sabs-v2" # This uses the project you configured with gcloud
  region  = "us-central1"
}

resource "google_compute_instance" "dev_vm" {
  name         = "sabs-v2-dev-vm"
  machine_type = "e2-standard-2"
  zone         = "us-central1-a"

  boot_disk {
    initialize_params {
      image = "ubuntu-os-cloud/ubuntu-2204-lts"
    }
  }

  network_interface {
    network = "default"
    access_config {
      // Ephemeral IP
    }
  }

  metadata_startup_script = <<-EOT
    #!/bin/bash
    sudo apt-get update
    sudo apt-get install -y docker.io nodejs npm
  EOT
}