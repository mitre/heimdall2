#!/bin/sh

jq '.
# Make statistic duration optional
| .definitions["Statistics"].required = []

# Naturally, if we have results we will also not know specifically how long they last
| .definitions["Control_Result"].required -= ["run_time"]

# And code as well because sometimes, it just aint there (e.g. web stuff)
| .definitions["Exec_JSON_Control"].required -= ["code"]

# Insert Waiver Data
| .definitions.Waiver_Data = {"type":"object","additionalProperties":true,"required":[],"properties":{"expiration_date":{"type":"string"},"justification":{"type":"string"},"message":{"type":"string"},"run":{"type":"boolean"},"skipped_due_to_waiver":{"type":["string","boolean"]}}}

# Insert Attestation Status
| .definitions.Attestation_Status = {"type": "string", "enum": ["passed", "failed"], "description": "The attested status of the control", "title": "Control Attestation Status"}

# Insert Attestation Data
| .definitions.Attestation_Data = {"type":"object", "additionalProperties": true, "required": ["control_id", "explanation", "frequency", "status", "updated", "updated_by"], "properties": {"control_id": {"type":"string"}, "explanation": {"type": "string"}, "frequency": {"type": "string"}, "status": {"$ref": "#/definitions/Attestation_Status"}, "updated": {"type": "string"}, "updated_by": {"type": "string"}}}

# Insert waiver_data reference
| .definitions["Exec_JSON_Control"].properties.waiver_data = {"$ref":"#/definitions/Waiver_Data"}

# Insert attestation_data reference
| .definitions["Exec_JSON_Control"].properties.attestation_data = {"$ref":"#/definitions/Attestation_Data"}

# Insert Control Result Control Result Override
#| .definitions.Control_Result_Override = {"type":"object","additionalProperties":true,"description": "Control override extended information","required":["cab_date","cab_status","is_approved","cyber_reviewer","date_modified","description","info_url","pipeline_hash","review_update","revised_categorization","revised_severity","request_type","request_type","reviewer","ticket_tracking"],"properties":{"cab_date":{"type":"string"},"cab_status":{"$ref": "#/definitions/Control_Result_Status"},"is_approved":{"type":"boolean"},"cyber_reviewer":{"type":"string"},"date_modified":{"type":"string"},"description":{"type":"string"},"info_url":{"type":"string"},"pipeline_hash":{"type":"string"},"review_update":{"type":"string"},"revised_categorization":{"type":"string"},"revised_severity":{"type":"number"},"request_type":{"type":"string"},"request_type":{"type":"string"},"reviewer":{"type":"string"},"ticket_tracking":{"type":"string"}}}
| .definitions.Control_Result_Override = {"type":"object","additionalProperties":true,"description": "Control override extended information","required":[],"properties":{"cab_date":{"type":"string"},"cab_status":{"$ref": "#/definitions/Control_Result_Status"},"is_approved":{"type":"boolean"},"cyber_reviewer":{"type":"string"},"date_modified":{"type":"string"},"description":{"type":"string"},"info_url":{"type":"string"},"pipeline_hash":{"type":"string"},"review_update":{"type":"string"},"revised_categorization":{"type":"string"},"revised_severity":{"type":"number"},"request_type":{"type":"string"},"request_type":{"type":"string"},"reviewer":{"type":"string"},"ticket_tracking":{"type":"string"}}}

# Insert Control Result Control Result reference
| .definitions["Control_Result"].properties.override = {"$ref":"#/definitions/Control_Result_Override"}

# Insert vulnerability scan result source
| .definitions["Control_Result"].properties.result_source = {"type": "string", "description": "Result source"}

# Insert overridden status result
| .definitions["Control_Result"].properties.originalStatus = {"type": "string", "description": "Original status of the control (only set if overriden)"}

# Insert new Status codes
| .definitions["Control_Result_Status"].enum += ["pending", "not_applicable"]

' <&0
