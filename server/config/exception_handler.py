from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status


def custom_exception_handler(exc, context):
    # Varsayılan exception handler'ı çağırıyoruz.
    response = exception_handler(exc, context)

    # Eğer bir DRF hatasıysa varsayılan yanıt dönsün.
    if response is not None:
        return response

    # Eğer farklı bir hata varsa burada loglama yapabiliriz.
    return Response(
        {
            "error": str(exc),
            "details": getattr(exc, "args", []),
        },
        status=status.HTTP_500_INTERNAL_SERVER_ERROR
    )
