from django.shortcuts import render, redirect
from .models import Expense


def dashboard(request):

    if request.method == "POST":
        date = request.POST.get("date")
        category = request.POST.get("category")
        description = request.POST.get("description")
        amount = request.POST.get("amount")

        Expense.objects.create(
            date=date,
            category=category,
            description=description,
            amount=amount
        )

        return redirect("dashboard")

    expenses = Expense.objects.all().order_by("-date")
    total = sum(expense.amount for expense in expenses)

    return render(request, "dashboard.html", {
        "expenses": expenses,
        "total": total
    })


def delete_expense(request, expense_id):
    expense = Expense.objects.get(id=expense_id)
    expense.delete()

    return redirect("dashboard")