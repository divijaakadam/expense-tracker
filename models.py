from django.db import models


class Expense(models.Model):
    date = models.DateField()
    category = models.CharField(max_length=50)
    description = models.CharField(max_length=200)
    amount = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return self.description