import express from 'express';
import * as sqlite from 'sqlite';
import sqlite3 from 'sqlite3';

const app = express();
const PORT = process.env.PORT || 4011;

app.use(express.static('public'));
app.use(express.json());

(async () => {
    const db = await sqlite.open({
        filename: './data_plan.db',
        driver: sqlite3.Database
    });

    // Run migrations
    await db.migrate();

    // Routes
    app.get('/api/price_plans', async (req, res) => {
        const plans = await db.all('SELECT * FROM price_plan');
        res.json(plans);
    });

    app.post('/api/price_plan/create', async (req, res) => {
        const { name, call_cost, sms_cost } = req.body;
        await db.run('INSERT INTO price_plan (plan_name, sms_price, call_price) VALUES (?, ?, ?)', [name, sms_cost, call_cost]);
        res.json({ message: "Price plan created!" });
    });

    app.post('/api/price_plan/update', async (req, res) => {
        const { name, call_cost, sms_cost } = req.body;
        await db.run('UPDATE price_plan SET sms_price = ?, call_price = ? WHERE plan_name = ?', [sms_cost, call_cost, name]);
        res.json({ message: "Price plan updated!" });
    });

    app.post('/api/price_plan/delete', async (req, res) => {
        const { id } = req.body;
        await db.run('DELETE FROM price_plan WHERE id = ?', [id]);
        res.json({ message: "Price plan deleted!" });
    });

    app.post('/api/phonebill', async (req, res) => {
        const { price_plan, actions } = req.body;
        const plan = await db.get('SELECT * FROM price_plan WHERE plan_name = ?', [price_plan]);

        if (!plan) {
            return res.status(400).json({ error: 'Price plan not found' });
        }

        const actionList = actions.split(',').map(action => action.trim());
        let total = 0;

        actionList.forEach(action => {
            if (action === 'sms') {
                total += plan.sms_price;
            } else if (action === 'call') {
                total += plan.call_price;
            }
        });

        res.json({ total: total.toFixed(2) });
    });

    app.listen(PORT, () => {
        console.log(`Server started on ${PORT}`);
    });
})();
