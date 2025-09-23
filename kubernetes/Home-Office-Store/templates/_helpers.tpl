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
Create the name of the service account to use
*/}}
{{- define "Home-Office-Store.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "Home-Office-Store.fullname" .) .Values.serviceAccount.name | lower }}
{{- else }}
{{- default "default" .Values.serviceAccount.name | lower }}
{{- end }}
{{- end }}



# PODS LABELS
###################
{{/*
Backend component labels
*/}}
{{- define "Home-Office-Store.backend.labels" -}}
app: backend
{{- end }}


{{/*
Frontend component labels
*/}}
{{- define "Home-Office-Store.frontend.labels" -}}
app: frontend
{{- end }}


{{/*
N8N component labels
*/}}
{{- define "Home-Office-Store.n8n.labels" -}}
app: n8n
{{- end }}


{{/*
PostgreSQL database labels
*/}}
{{- define "Home-Office-Store.postgresql.labels" -}}
db: postgresql
{{- end }}




# SERVICES LABELS
{{/*
###################
Backend service labels
*/}}
{{- define "Home-Office-Store.backend.service.labels" -}}
{{ include "Home-Office-Store.backend.labels" . }}
{{- end }}

{{/*
Frontend service labels
*/}}
{{- define "Home-Office-Store.frontend.service.labels" -}}
{{ include "Home-Office-Store.frontend.labels" . }}
{{- end }}

{{/*
N8N service labels
*/}}
{{- define "Home-Office-Store.n8n.service.labels" -}}
{{ include "Home-Office-Store.n8n.labels" . }}
{{- end }}

{{/*
PostgreSQL service labels
*/}}
{{- define "Home-Office-Store.postgresql.service.labels" -}}
{{ include "Home-Office-Store.postgresql.labels" . }}
{{- end }}

