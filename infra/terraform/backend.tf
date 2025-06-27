terraform {
  backend "gcs" {
    bucket  = "sabs-v2-tf-state-20250627"
    prefix  = "terraform/state"
  }
}