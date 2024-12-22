import json
from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin


class JSONErrorMiddleware(MiddlewareMixin):
    def process_exception(self, request, exception):
        response_data = {
            "error": "A server error occurred",
            "details": str(exception),
        }
        return JsonResponse(response_data, status=500)

    def process_response(self, request, response):
        if response.status_code == 404:
            response_data = {
                "error": "Not found",
                "details": "The requested resource was not found on the server.",
            }
            return JsonResponse(response_data, status=404)
        return response
