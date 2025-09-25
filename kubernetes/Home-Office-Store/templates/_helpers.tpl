{{/*
Expand the name of the chart.
*/}}
{{- define "Home-Office-Store.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "Home-Office-Store.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "Home-Office-Store.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "Home-Office-Store.labels" -}}
helm.sh/chart: {{ include "Home-Office-Store.chart" . }}
{{ include "Home-Office-Store.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "Home-Office-Store.selectorLabels" -}}
app.kubernetes.io/name: {{ include "Home-Office-Store.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}



{{/*
frontend resources
*/}}
{{- define "Home-Office-Store.frontend.resources" -}}
resources:
  limits:
    cpu: {{ .Values.frontend.resources.limits.cpu | default "500m" }}
    memory: {{ .Values.frontend.resources.limits.memory | default "256Mi" }}
  requests:
    cpu: {{ .Values.frontend.resources.requests.cpu | default "250m" }}
    memory: {{ .Values.frontend.resources.requests.memory | default "128Mi" }}
{{- end -}}


{{/*
backend resources
*/}}
{{- define "Home-Office-Store.backend.resources" -}}
resources:
  limits:
    cpu: {{ .Values.backend.resources.limits.cpu | default "500m" }}
    memory: {{ .Values.backend.resources.limits.memory | default "256Mi" }}
  requests:
    cpu: {{ .Values.backend.resources.requests.cpu | default "250m" }}
    memory: {{ .Values.backend.resources.requests.memory | default "128Mi" }}
{{- end -}}


{{/*
n8n resources
*/}}
{{- define "Home-Office-Store.n8n.resources" -}}
resources:
  limits:
    cpu: {{ .Values.n8n.resources.limits.cpu | default "500m" }}
    memory: {{ .Values.n8n.resources.limits.memory | default "256Mi" }}
  requests:
    cpu: {{ .Values.n8n.resources.requests.cpu | default "250m" }}
    memory: {{ .Values.n8n.resources.requests.memory | default "128Mi" }}
{{- end -}}


{{/*
postgresql resources
*/}}
{{- define "Home-Office-Store.postgresql.resources" -}}
resources:
  limits:
    cpu: {{ .Values.postgresql.resources.limits.cpu | default "500m" }}
    memory: {{ .Values.postgresql.resources.limits.memory | default "256Mi" }}
  requests:
    cpu: {{ .Values.postgresql.resources.requests.cpu | default "250m" }}
    memory: {{ .Values.postgresql.resources.requests.memory | default "128Mi" }}
{{- end -}}