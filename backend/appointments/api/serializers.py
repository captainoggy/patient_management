from django.db import IntegrityError
from rest_framework import serializers

from appointments.models import Appointment
from clinicians.api.serializers import ClinicianSerializer
from clinicians.models import Clinician
from patients.models import Patient


class AppointmentForPatientSerializer(serializers.ModelSerializer):
    """Nested on patient detail; omits redundant patient fields."""

    clinicians = ClinicianSerializer(many=True, read_only=True)

    class Meta:
        model = Appointment
        fields = ("id", "scheduled_at", "notes", "clinicians")


class AppointmentSerializer(serializers.ModelSerializer):
    patient_first_name = serializers.CharField(source="patient.first_name", read_only=True)
    patient_last_name = serializers.CharField(source="patient.last_name", read_only=True)
    clinicians = ClinicianSerializer(many=True, read_only=True)

    class Meta:
        model = Appointment
        fields = (
            "id",
            "patient",
            "patient_first_name",
            "patient_last_name",
            "scheduled_at",
            "notes",
            "clinicians",
        )


class AppointmentWriteSerializer(serializers.ModelSerializer):
    """Create/update visits; assign clinic staff via clinician_ids."""

    clinicians = ClinicianSerializer(many=True, read_only=True)
    clinician_ids = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        write_only=True,
        required=False,
        allow_empty=True,
    )

    class Meta:
        model = Appointment
        fields = (
            "id",
            "patient",
            "scheduled_at",
            "notes",
            "clinicians",
            "clinician_ids",
        )
        read_only_fields = ("id", "clinicians")

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if getattr(self, "instance", None) is not None:
            self.fields["patient"].read_only = True

    def validate_patient(self, patient: Patient) -> Patient:
        request = self.context.get("request")
        if request is None:
            return patient
        clinic_id = getattr(request, "resolved_clinic_id", None)
        if clinic_id is None:
            raise serializers.ValidationError("Clinic scope missing.")
        if patient.clinic_id != clinic_id:
            raise serializers.ValidationError("Patient is not in your clinic.")
        return patient

    def validate_clinician_ids(self, ids: list[int]) -> list[int]:
        request = self.context.get("request")
        if request is None:
            return ids
        clinic_id = getattr(request, "resolved_clinic_id", None)
        if clinic_id is None:
            raise serializers.ValidationError("Clinic scope missing.")
        if not ids:
            return []
        uniq = list(dict.fromkeys(ids))
        found = Clinician.objects.filter(id__in=uniq, clinic_id=clinic_id).count()
        if found != len(uniq):
            raise serializers.ValidationError(
                "One or more clinician ids are invalid or not in your clinic.",
            )
        return uniq

    def validate(self, attrs):
        """Block duplicate slots: same patient cannot have two visits at the same instant;
        clinicians cannot be on two visits at the same instant (within this clinic).
        """
        instance = self.instance
        patient = attrs.get("patient", getattr(instance, "patient", None))
        scheduled_at = attrs.get("scheduled_at", getattr(instance, "scheduled_at", None))

        if patient is None or scheduled_at is None:
            return attrs

        patient_qs = Appointment.objects.filter(patient_id=patient.pk, scheduled_at=scheduled_at)
        if instance is not None:
            patient_qs = patient_qs.exclude(pk=instance.pk)
        if patient_qs.exists():
            raise serializers.ValidationError(
                {
                    "scheduled_at": (
                        "This patient already has another visit at this date and time. "
                        "Choose a different time."
                    ),
                },
            )

        id_list = attrs.get("clinician_ids")
        if id_list is None and instance is not None:
            id_list = list(instance.clinicians.values_list("pk", flat=True))
        else:
            id_list = id_list or []

        clinic_id = patient.clinic_id
        for cid in id_list:
            clash = Appointment.objects.filter(
                scheduled_at=scheduled_at,
                clinicians__id=cid,
                patient__clinic_id=clinic_id,
            )
            if instance is not None:
                clash = clash.exclude(pk=instance.pk)
            if clash.exists():
                raise serializers.ValidationError(
                    {
                        "scheduled_at": (
                            "One or more selected clinicians are already assigned to "
                            "another visit at this date and time."
                        ),
                    },
                )

        return attrs

    def create(self, validated_data):
        id_list = validated_data.pop("clinician_ids", [])
        try:
            appt = Appointment.objects.create(**validated_data)
        except IntegrityError as exc:
            patient = validated_data.get("patient")
            scheduled = validated_data.get("scheduled_at")
            pid = getattr(patient, "pk", patient)
            if (
                patient is not None
                and scheduled is not None
                and pid is not None
                and Appointment.objects.filter(
                    patient_id=pid,
                    scheduled_at=scheduled,
                ).exists()
            ):
                raise serializers.ValidationError(
                    {
                        "scheduled_at": (
                            "This patient already has another visit at this date and time. "
                            "Choose a different time."
                        ),
                    }
                ) from exc
            raise
        appt.clinicians.set(id_list)
        return appt

    def update(self, instance, validated_data):
        id_list = validated_data.pop("clinician_ids", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if id_list is not None:
            instance.clinicians.set(id_list)
        return instance

    def to_representation(self, instance):
        return AppointmentSerializer(instance, context=self.context).data
