{{- define "skillgap.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "skillgap.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name (include "skillgap.name" .) | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}

{{- define "skillgap.labels" -}}
helm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version | replace "+" "_" }}
app.kubernetes.io/name: {{ include "skillgap.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{- define "skillgap.backendName" -}}
{{ include "skillgap.fullname" . }}-backend
{{- end }}

{{- define "skillgap.frontendName" -}}
{{ include "skillgap.fullname" . }}-frontend
{{- end }}